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
        console.debug('[Relation Resolver] Cache initialized with models:', Array.from(this.modelCache.keys()));
    }

    private getModelById(modelId: string): ModelData | undefined {
        const model = this.modelCache.get(modelId);
        if (!model) {
            console.warn(`[Relation Resolver] Model not found in cache: ${modelId}`);
        }
        return model;
    }

    private getContentById<T extends Content | LocalizedContent>(
        modelId: string,
        contentId: string,
        locale?: string,
    ): T | undefined {
        const model = this.getModelById(modelId);
        if (!model) {
            console.warn(`[Relation Resolver] Cannot resolve relation: model ${modelId} not found`);
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

            if (!item) {
                console.warn(`[Relation Resolver] Localized content not found: ${contentId} (${locale}) in model ${modelId}`);
            }
        }
        else {
            item = model.content.find(content => content.ID === contentId);

            if (!item) {
                console.warn(`[Relation Resolver] Content not found: ${contentId} in model ${modelId}`);
            }
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

        console.debug(`[Relation Resolver] Resolving relations for model ${sourceModel.metadata.modelId}:`, {
            contentCount: content.length,
            relations,
            hasLocale: !!locale,
        });

        try {
            const resolvedContent = content.map((item) => {
                const resolvedItem = { ...item, _relations: {} } as T & { _relations: Record<string, unknown> };

                for (const relation of relations) {
                    const field = sourceModel.fields.find(f => f.name === relation);
                    if (!field || field.fieldType !== 'relation') {
                        console.warn(`[Relation Resolver] Invalid relation field: ${relation} in model ${sourceModel.metadata.modelId}`);
                        continue;
                    }

                    const targetModelId = field.options?.reference?.form?.reference?.value;
                    if (!targetModelId) {
                        console.warn(`[Relation Resolver] Missing target model reference for relation: ${relation}`);
                        continue;
                    }

                    const targetModel = this.getModelById(targetModelId);
                    if (!targetModel) {
                        console.warn(`[Relation Resolver] Target model not found: ${targetModelId}`);
                        continue;
                    }

                    const relationValue = item[relation];
                    if (!relationValue) {
                        // İlişki değeri boş olabilir, bu normal bir durum
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

                    if (!resolvedRelations.length) {
                        console.debug(`[Relation Resolver] No relations resolved for field ${relation} in item ${item.ID}`);
                        continue;
                    }

                    resolvedItem._relations[relation] = field.componentId === 'one-to-many'
                        ? resolvedRelations
                        : resolvedRelations[0];
                }

                return resolvedItem;
            });

            console.debug(`[Relation Resolver] Relations resolved successfully for ${resolvedContent.length} items`);
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
