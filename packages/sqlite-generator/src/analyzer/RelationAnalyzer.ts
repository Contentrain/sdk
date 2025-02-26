import type { ContentItem, RawContentItem, RelationItem } from '../types/content';
import type { ModelConfig, ModelField, RelationType } from '../types/model';
import { DefaultContentTransformer } from '../normalizer/ContentTransformer';
import { ErrorCode, ValidationError } from '../types/errors';
import { ValidationManager } from '../validation/ValidationManager';

export class RelationAnalyzer {
    private validationManager: ValidationManager;
    private contentTransformer: DefaultContentTransformer;

    constructor(private models: ModelConfig[]) {
        if (!models?.length) {
            throw new ValidationError({
                code: ErrorCode.MODEL_LIST_EMPTY,
                message: 'Model list cannot be empty',
            });
        }
        this.validationManager = new ValidationManager();
        this.contentTransformer = new DefaultContentTransformer();
        this.validationManager.buildRelationMap(models);
    }

    /**
     * Analyzes relations between models
     */
    public analyzeRelations(model: ModelConfig, items: Array<Record<string, unknown>>): RelationItem[] {
        const relations: RelationItem[] = [];
        const relationFields = this.findRelationFields(model);

        for (const field of relationFields) {
            const reference = field.options?.reference;
            if (!reference?.value || !reference.form.reference.value) {
                throw new ValidationError({
                    code: ErrorCode.INVALID_RELATION_CONFIG,
                    message: 'Invalid relation configuration',
                    details: { modelId: model.id, fieldId: field.fieldId },
                });
            }

            const targetModel = this.models.find(m => m.id === reference.form.reference.value);
            if (!targetModel) {
                throw new ValidationError({
                    code: ErrorCode.TARGET_MODEL_NOT_FOUND,
                    message: 'Target model not found',
                    details: { modelId: model.id, targetModel: reference.form.reference.value },
                });
            }

            for (const item of items) {
                if (!this.validationManager.isValidContentItem(item)) {
                    throw new ValidationError({
                        code: ErrorCode.INVALID_CONTENT_ITEM,
                        message: 'Invalid content item',
                        details: { item: JSON.stringify(item) },
                    });
                }

                const relationIds = this.getRelationIds(item[field.fieldId]);
                if (!relationIds.length)
                    continue;

                const normalizedItem = this.normalizeContentItem(item);

                // For one-to-many relations, create multiple relation items
                if (field.componentId === 'one-to-many') {
                    for (const targetId of relationIds) {
                        relations.push({
                            id: `${normalizedItem.id}_${field.fieldId}_${targetId}`,
                            sourceModel: model.id,
                            sourceId: normalizedItem.id,
                            targetModel: reference.form.reference.value,
                            targetId,
                            fieldId: field.fieldId,
                            type: field.componentId as RelationType,
                        });
                    }
                }
                // For one-to-one relations, only use the first ID
                else {
                    relations.push({
                        id: `${normalizedItem.id}_${field.fieldId}_${relationIds[0]}`,
                        sourceModel: model.id,
                        sourceId: normalizedItem.id,
                        targetModel: reference.form.reference.value,
                        targetId: relationIds[0],
                        fieldId: field.fieldId,
                        type: field.componentId as RelationType,
                    });
                }
            }
        }

        return relations;
    }

    /**
     * Normalizes content item
     */
    private normalizeContentItem(item: RawContentItem): ContentItem {
        return this.contentTransformer.normalizeContent(item);
    }

    /**
     * Validates relations between models
     */
    public validateRelations(): void {
        const relations = this.getAllRelations();

        // Check for circular dependencies
        for (const relation of relations) {
            if (this.validationManager.validateCircularDependency(relation.sourceModel, relation.targetModel)) {
                throw new ValidationError({
                    code: ErrorCode.CIRCULAR_DEPENDENCY,
                    message: 'Circular dependency detected',
                    details: { sourceModel: relation.sourceModel, targetModel: relation.targetModel },
                });
            }
        }

        // Validate reference fields
        for (const relation of relations) {
            // Check target model exists
            const targetModel = this.models.find(m => m.id === relation.targetModel);
            if (!targetModel) {
                throw new ValidationError({
                    code: ErrorCode.TARGET_MODEL_NOT_FOUND,
                    message: 'Target model not found',
                    details: { targetModel: relation.targetModel, sourceModel: relation.sourceModel },
                });
            }

            // Check title field if specified
            const field = this.findField(relation.sourceModel, relation.fieldId);
            const titleField = field?.options?.reference?.form?.titleField?.value;
            if (titleField) {
                const targetField = targetModel.fields.find(f => f.fieldId === titleField);
                if (!targetField) {
                    throw new ValidationError({
                        code: ErrorCode.TITLE_FIELD_NOT_FOUND,
                        message: 'Title field not found',
                        details: { titleField, targetModel: relation.targetModel },
                    });
                }

                if (targetField.fieldType !== 'string' || !['single-line-text', 'multi-line-text'].includes(targetField.componentId)) {
                    throw new ValidationError({
                        code: ErrorCode.INVALID_FIELD_TYPE,
                        message: 'Invalid title field type',
                        details: { titleField, targetModel: relation.targetModel },
                    });
                }
            }
        }
    }

    /**
     * Finds relation fields in a model
     */
    public findRelationFields(model: ModelConfig): ModelField[] {
        return model.fields.filter(field =>
            field.fieldType === 'relation'
            && (field.componentId === 'one-to-one' || field.componentId === 'one-to-many'),
        );
    }

    /**
     * Gets all relations from models
     */
    private getAllRelations(): RelationItem[] {
        const relations: RelationItem[] = [];

        for (const model of this.models) {
            const relationFields = this.findRelationFields(model);
            for (const field of relationFields) {
                const reference = field.options?.reference;
                if (!reference?.value || !reference.form.reference.value)
                    continue;

                relations.push({
                    id: `${model.id}_${field.fieldId}`,
                    sourceModel: model.id,
                    sourceId: '',
                    targetModel: reference.form.reference.value,
                    targetId: '',
                    fieldId: field.fieldId,
                    type: field.componentId as RelationType,
                });
            }
        }

        return relations;
    }

    /**
     * Gets relation IDs from a field value
     */
    private getRelationIds(value: unknown): string[] {
        if (!value)
            return [];
        if (typeof value === 'string')
            return [value];
        if (Array.isArray(value))
            return value.filter((v): v is string => typeof v === 'string');
        return [];
    }

    /**
     * Finds field information
     */
    private findField(modelId: string, fieldId: string): ModelField | undefined {
        const model = this.models.find(m => m.id === modelId);
        return model?.fields.find(f => f.fieldId === fieldId);
    }
}
