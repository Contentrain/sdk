import type { Content, LocalizedContent, ModelData } from '../../../types';

export class RelationResolver {
    private modelCache: Map<string, ModelData> = new Map();

    constructor(private models: ModelData[]) {
        this.initializeCache();
    }

    private initializeCache() {
        for (const model of this.models) {
            this.modelCache.set(model.metadata.modelId, model);
        }
    }

    private getModelById(modelId: string): ModelData | undefined {
        return this.modelCache.get(modelId);
    }

    private getContentById(modelId: string, contentId: string, locale?: string): Content | LocalizedContent | undefined {
        const model = this.getModelById(modelId);
        if (!model)
            return undefined;

        if (model.metadata.localization && locale) {
            return model.content.find(
                item =>
                    'lang' in item
                    && item.ID === contentId
                    && item.lang === locale,
            ) as LocalizedContent | undefined;
        }

        return model.content.find(item => item.ID === contentId);
    }

    async resolveRelations<T extends Content | LocalizedContent>(
        sourceModel: ModelData,
        content: T[],
        relations: string[],
        locale?: string,
    ): Promise<T[]> {
        if (!relations.length)
            return content;

        const resolvedContent = content.map((item) => {
            const resolvedItem = { ...item, _relations: {} } as T & { _relations: Record<string, unknown> };

            for (const relation of relations) {
                const field = sourceModel.fields.find(f => f.name === relation);
                if (!field || field.fieldType !== 'relation')
                    continue;

                const targetModelId = field.options?.reference?.form?.reference?.value;
                if (!targetModelId)
                    continue;

                const targetModel = this.getModelById(targetModelId);
                if (!targetModel)
                    continue;

                const relationIds = Array.isArray(item[relation]) ? item[relation] : [item[relation]];
                if (!relationIds.length)
                    continue;

                const resolvedRelations = relationIds
                    .map(id => this.getContentById(targetModelId, String(id), locale))
                    .filter((item): item is Content | LocalizedContent => item !== undefined);

                if (!resolvedRelations.length)
                    continue;

                resolvedItem._relations[relation] = field.componentId === 'one-to-many'
                    ? resolvedRelations
                    : resolvedRelations[0];
            }

            return resolvedItem;
        });

        return resolvedContent;
    }
}
