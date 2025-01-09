import type { ContentrainBaseModel, ContentrainField, ContentrainModelMetadata } from '@contentrain/types';

export interface FAQ extends ContentrainBaseModel {
  question: string
  answer: string
  order: number
  scheduled: boolean
}

export interface WorkCategory extends ContentrainBaseModel {
  category: string
  order: number
  scheduled: boolean
}

export const mockData = {
  faqitems: [
    {
      ID: '0c1b5726fbf6',
      createdAt: '2024-10-13T09:47:51.000Z',
      updatedAt: '2024-10-13T10:53:47.055Z',
      status: 'publish',
      question: 'Do you offer technical support and maintenance services after delivering the project?',
      answer: 'Yes, we provide ongoing technical support and maintenance services to ensure your product runs smoothly. Our support includes bug fixes, updates, and feature enhancements.',
      order: 7,
      scheduled: false,
    },
    {
      ID: '7d33292fa865',
      createdAt: '2024-10-13T10:16:28.000Z',
      updatedAt: '2024-10-13T11:03:34.276Z',
      status: 'publish',
      question: 'Can you integrate 3rd party app services into my existing project?',
      answer: 'Our team is skilled in integrating 3rd party solutions with existing systems. Whether it\'s APIs or 3rd platforms we provide seamless integrations to enhance your digital ecosystem.',
      order: 10,
      scheduled: false,
    },
  ] as FAQ[],

  workcategories: [
    {
      ID: '59cbdac46c1e',
      createdAt: 'Wed Oct 16 2024 11:08:46 GMT+0300 (GMT+03:00)',
      updatedAt: 'Wed Oct 16 2024 11:08:46 GMT+0300 (GMT+03:00)',
      category: 'Web Design & Development',
      status: 'publish',
      scheduled: false,
      order: 6,
    },
    {
      ID: '8ac7d8c79484',
      createdAt: 'Wed Oct 16 2024 13:49:43 GMT+0300 (GMT+03:00)',
      updatedAt: 'Wed Oct 16 2024 13:49:43 GMT+0300 (GMT+03:00)',
      category: 'Support & Maintenance',
      status: 'publish',
      scheduled: false,
      order: 7,
    },
  ] as WorkCategory[],

  localizedFaqItems: {
    tr: [
      {
        ID: '0c1b5726fbf6',
        createdAt: '2024-10-13T09:47:51.000Z',
        updatedAt: '2024-10-13T10:53:47.058Z',
        status: 'publish',
        question: 'Proje tesliminden sonra teknik destek ve bakım hizmeti sunuyor musunuz?',
        answer: 'Evet, ürününüzün sorunsuz çalışmasını sağlamak için teknik destek ve bakım hizmetleri sağlıyoruz. Desteğimiz hata düzeltmeleri, güncellemeler ve özellik geliştirmelerini içeriyor.',
        order: 7,
        scheduled: false,
      },
      {
        ID: '7d33292fa865',
        createdAt: '2024-10-13T10:16:28.000Z',
        updatedAt: '2024-10-13T11:03:34.282Z',
        status: 'publish',
        question: 'Mevcut projeme 3. parti uygulamaları entegre edebilir misiniz?',
        answer: 'Ekibimiz, 3. parti çözümleri mevcut sistemlerle entegre etme konusunda uzmandır. API\'leri ve 3. parti çözümleri dijital ekosisteminizi geliştirmek için projenize entegre ediyoruz.',
        order: 10,
        scheduled: false,
      },
    ] as FAQ[],
  },

  localizedWorkCategories: {
    tr: [
      {
        ID: '59cbdac46c1e',
        createdAt: 'Wed Oct 16 2024 11:08:46 GMT+0300 (GMT+03:00)',
        updatedAt: 'Wed Oct 16 2024 11:08:46 GMT+0300 (GMT+03:00)',
        category: 'Web Tasarım ve Geliştirme',
        status: 'publish',
        scheduled: false,
        order: 6,
      },
      {
        ID: '8ac7d8c79484',
        createdAt: 'Wed Oct 16 2024 13:49:43 GMT+0300 (GMT+03:00)',
        updatedAt: 'Wed Oct 16 2024 13:49:43 GMT+0300 (GMT+03:00)',
        category: 'Destek ve Bakım',
        status: 'publish',
        scheduled: false,
        order: 7,
      },
    ] as WorkCategory[],
  },

  metadata: {
    faqitems: {
      name: 'FAQ Items',
      modelId: 'faqitems',
      localization: true,
      type: 'JSON',
      createdBy: 'system',
      isServerless: false,
      fields: [
        {
          name: 'question',
          fieldId: 'question',
          componentId: 'single-line-text',
          fieldType: 'string',
          options: {},
          validations: { 'required-field': { value: true } },
          modelId: 'faqitems',
        },
        {
          name: 'answer',
          fieldId: 'answer',
          componentId: 'multi-line-text',
          fieldType: 'string',
          options: {},
          validations: { 'required-field': { value: true } },
          modelId: 'faqitems',
        },
        {
          name: 'order',
          fieldId: 'order',
          componentId: 'number',
          fieldType: 'number',
          options: {},
          validations: { 'required-field': { value: true } },
          modelId: 'faqitems',
        },
      ] as ContentrainField[],
    } as ContentrainModelMetadata,
    workcategories: {
      name: 'Work Categories',
      modelId: 'workcategories',
      localization: true,
      type: 'JSON',
      createdBy: 'system',
      isServerless: false,
      fields: [
        {
          name: 'category',
          fieldId: 'category',
          componentId: 'single-line-text',
          fieldType: 'string',
          options: {},
          validations: { 'required-field': { value: true } },
          modelId: 'workcategories',
        },
        {
          name: 'order',
          fieldId: 'order',
          componentId: 'number',
          fieldType: 'number',
          options: {},
          validations: { 'required-field': { value: true } },
          modelId: 'workcategories',
        },
      ] as ContentrainField[],
    } as ContentrainModelMetadata,
  },
};
