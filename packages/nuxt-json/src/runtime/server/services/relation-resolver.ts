import type { Content, LocalizedContent, ModelData } from '../../../types';
import { ContentrainError, ERROR_CODES } from '../utils/errors';

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
        const model = this.modelCache.get(modelId);
        return model;
    }

    private getContentById<T extends Content | LocalizedContent>(
        modelId: string,
        contentId: string,
        locale?: string,
    ): T | undefined {
        const model = this.getModelById(modelId);
        if (!model) {
            return undefined;
        }

        let item: Content | LocalizedContent | undefined;

        if (model.metadata.localization && locale) {
            item = model.content.find(
                content =>
                    '_lang' in content
                    && content.ID === contentId
                    && content._lang === locale,
            );
        }
        else {
            item = model.content.find(content => content.ID === contentId);
        }

        return item as T | undefined;
    }

    async resolveRelations<T extends Content | LocalizedContent>(
        sourceModel: ModelData,
        content: T[],
        relations: string[],
        locale?: string,
    ): Promise<T[]> {
        if (!relations.length) {
            return content;
        }

        try {
            const resolvedContent = content.map((item) => {
                const resolvedItem = { ...item, _relations: {} } as T & { _relations: Record<string, unknown> };

                for (const relation of relations) {
                    let field = sourceModel.fields.find(f => f.fieldId === relation);

                    if (!field) {
                        field = sourceModel.fields.find(f => f.name === relation);
                    }

                    if (!field || field.fieldType !== 'relation') {
                        continue;
                    }

                    const targetModelId = field.options?.reference?.form?.reference?.value;
                    if (!targetModelId) {
                        continue;
                    }

                    const targetModel = this.getModelById(targetModelId);
                    if (!targetModel) {
                        continue;
                    }

                    let relationValue = item[field.fieldId];

                    if (relationValue === undefined && field.fieldId !== field.name) {
                        relationValue = item[field.name];
                    }

                    if (!relationValue) {
                        continue;
                    }

                    const relationIds = Array.isArray(relationValue) ? relationValue : [relationValue];
                    if (!relationIds.length) {
                        continue;
                    }

                    const isLocalizedTarget = targetModel.metadata.localization;
                    const resolvedRelations = relationIds
                        .map((id) => {
                            const contentId = String(id);
                            if (isLocalizedTarget && locale) {
                                return this.getContentById<LocalizedContent>(targetModelId, contentId, locale);
                            }
                            else {
                                return this.getContentById<Content>(targetModelId, contentId);
                            }
                        })
                        .filter((item): item is Content | LocalizedContent => item !== undefined);

                    resolvedItem._relations[relation] = field.componentId === 'one-to-many'
                        ? resolvedRelations
                        : resolvedRelations[0];
                }

                return resolvedItem;
            });

            return resolvedContent;
        }
        catch (error) {
            console.error('[Relation Resolver] Error resolving relations:', error);
            throw new ContentrainError({
                code: ERROR_CODES.CONTENT_NOT_FOUND,
                message: 'Error resolving relations',
                details: error,
            });
        }
    }
}
