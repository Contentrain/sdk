# SQL Sorgu Çıktıları

## 1. Temel Sorgular

### Sıralama

```typescript
const orderedItems = await queryWorkItemsByOrder(db);
```

```json
[
  {
    "ID": "8a8044e883e8",
    "title": "Contentrain",
    "image": "public/1729065603135_denemecontentrain.svg",
    "description": "Contentrain is a scalable content management platform combining Git and serverless platforms.\n\nWe planned the entire project workflow, designed the software architecture, developed the frontend and backend, structured the database, and integrated all components before deployment.",
    "category": "bcc834108adc",
    "link": "https://contentrain.io/",
    "order_field": 1,
    "status": "publish",
    "created_at": "2024-09-26T18:08:38.000Z",
    "updated_at": "2024-10-16T08:03:22.597Z",
    "scheduled": 0,
    "scheduled_at": null,
    "i18n": {
      "lang": "tr",
      "ID": "8a8044e883e8",
      "created_at": "2024-09-26T18:08:38.000Z",
      "updated_at": "2024-10-25T16:49:44.612Z",
      "title": "Contentrain",
      "image": "public/1729065603135_denemecontentrain.svg",
      "description": "Contentrain, Git ve serverless platformları birleştiren, ölçeklenebilir bir içerik yönetim platformudur.\n\nTüm proje iş akışını planladık, yazılım mimarisini tasarladık, frontend ve backend geliştirmelerini yaptık, veritabanını yapılandırdık ve tüm bileşenleri dağıtımdan önce entegre ettik.",
      "link": "https://contentrain.io/",
      "order_field": 1
    }
  },
  {
    "ID": "8a8044e883e9",
    "title": "Bloom and Fresh",
    "image": "public/1729874043253_Bloomandfresh.svg",
    "description": "Bloom & Fresh is an eCommerce platform specializing in floral arrangements and gifts.\n\nWe modernized the frontend with Vue.js and Nuxt.js, integrating it with the client's existing backend system.",
    "category": "cab37361e7e6",
    "link": "https://bloomandfresh.com",
    "order_field": 2,
    "status": "publish",
    "created_at": "2024-09-26T18:08:38.000Z",
    "updated_at": "2024-10-25T16:38:01.208Z",
    "scheduled": 0,
    "scheduled_at": null,
    "i18n": {
      "lang": "tr",
      "ID": "8a8044e883e9",
      "created_at": "2024-09-26T18:08:38.000Z",
      "updated_at": "2024-10-25T16:38:01.211Z",
      "title": "Bloom and Fresh",
      "image": "public/1729874043253_Bloomandfresh.svg",
      "description": "Bloom & Fresh, çiçek aranjmanları ve hediyeler konusunda uzmanlaşmış bir e-ticaret platformudur.\n\nFrontend kısmını Vue.js ve Nuxt.js ile modernize ettik ve bunu müşterinin mevcut Backend sistemiyle entegre ettik.",
      "link": "https://bloomandfresh.com",
      "order_field": 2
    }
  },
  {
    "ID": "8a8044e883ea",
    "title": "Wordify",
    "image": "public/1729066309718_wordify.svg",
    "description": "We transformed Wordify's Squarespace-based website into a custom site using Jamstack architecture. This upgrade provided Wordify with a smooth look, enhanced performance, scalability, and improved user experience.",
    "category": "cab37361e7ea",
    "link": "https://www.wordify.co/",
    "order_field": 3,
    "status": "publish",
    "created_at": "2024-09-26T18:08:38.000Z",
    "updated_at": "2024-10-16T08:13:12.448Z",
    "scheduled": 0,
    "scheduled_at": null,
    "i18n": {
      "lang": "tr",
      "ID": "8a8044e883ea",
      "created_at": "2024-09-26T18:08:38.000Z",
      "updated_at": "2024-10-16T08:13:12.451Z",
      "title": "Wordify",
      "image": "public/1729066309718_wordify.svg",
      "description": "Wordify'ın Squarespace tabanlı web sitesini Jamstack mimarisini kullanarak özel bir siteye dönüştürdük. Bu yükseltme Wordify'a pürüzsüz bir görünüm, gelişmiş performans, ölçeklenebilirlik ve iyileştirilmiş kullanıcı deneyimi sağladı.",
      "link": "https://www.wordify.co/",
      "order_field": 3
    }
  },
  {
    "ID": "51bf2dbbed29",
    "title": "Popile",
    "image": "public/1729874670881_popile.svg",
    "description": "Popile is the meeting point of data and creativity in influencer marketing. We made improvements on the frontend using Vue.js, supported payment system integrations, and optimized the backend for better performance.",
    "category": "8ac7d8c79484",
    "link": "https://www.popile.com/",
    "order_field": 4,
    "status": "publish",
    "created_at": "2024-10-16T10:45:44.000Z",
    "updated_at": "2024-10-25T16:45:21.855Z",
    "scheduled": 0,
    "scheduled_at": null,
    "i18n": {
      "lang": "tr",
      "ID": "51bf2dbbed29",
      "created_at": "2024-10-16T10:45:44.000Z",
      "updated_at": "2024-10-25T16:45:21.859Z",
      "title": "Popile",
      "image": "public/1729874670881_popile.svg",
      "description": "Popile, influencer pazarlamasında veri ve yaratıcılığın buluşma noktasıdır. Frontend tarafında Vue.js ile iyileştirmeler yaptık, ödeme sistemi entegrasyonlarında destek sağladık ve backend tarafında performans optimizasyonları gerçekleştirdik.",
      "link": "https://www.popile.com/",
      "order_field": 4
    }
  },
  {
    "ID": "8a8044e883eb",
    "title": "Visivi",
    "image": "public/1729074133746_visivi.svg",
    "description": "Visivi is an HR platform with both mobile and web portals. \n\nWe developed the mobile application with React Native, making it cross-platform for both iOS and Android. For the web portal, we used Nuxt.js and Vue.js.",
    "category": "bcc834108adc",
    "link": "https://visivi.co/",
    "order_field": 5,
    "status": "publish",
    "created_at": "2024-09-26T18:08:38.000Z",
    "updated_at": "2024-10-16T10:22:34.812Z",
    "scheduled": 0,
    "scheduled_at": null,
    "i18n": {
      "lang": "tr",
      "ID": "8a8044e883eb",
      "created_at": "2024-09-26T18:08:38.000Z",
      "updated_at": "2024-10-16T10:22:34.815Z",
      "title": "Visivi",
      "image": "public/1729074133746_visivi.svg",
      "description": "Visivi, hem mobil hem de web portalları olan bir İK platformudur.\n\nMobil uygulamayı React Native ile geliştirdik ve hem iOS hem de Android için çapraz platform haline getirdik. Web portalı için Nuxt.js ve Vue.js kullandık.",
      "link": "https://visivi.co/",
      "order_field": 5
    }
  },
  {
    "ID": "8a8044e883ec",
    "title": "DXP 360",
    "image": "public/1729074312031_dxp360.svg",
    "description": "DXP360 is an RFP (Request for Proposal) portal that aggregates RFPs from various sources, simplifying the proposal discovery and submission process for enterprises and agencies.\n\nWe designed the project plan based on client briefs, developed the frontend and backend, structured the database, and deployed the project.",
    "category": "bcc834108adc",
    "link": "https://dxp360.com/",
    "order_field": 6,
    "status": "publish",
    "created_at": "2024-09-26T18:08:38.000Z",
    "updated_at": "2024-10-16T10:27:04.241Z",
    "scheduled": 0,
    "scheduled_at": null,
    "i18n": {
      "lang": "tr",
      "ID": "8a8044e883ec",
      "created_at": "2024-09-26T18:08:38.000Z",
      "updated_at": "2024-10-16T10:27:04.245Z",
      "title": "DXP 360",
      "image": "public/1729074312031_dxp360.svg",
      "description": "DXP360, çeşitli kaynaklardan gelen RFP'leri bir araya getiren ve işletmeler ve ajanslar için teklif keşfi ve gönderim sürecini basitleştiren bir RFP (Teklif Talebi) portalıdır.\n\nProje planını müşteri brifinglerine göre tasarladık, ön ucu ve arka ucu geliştirdik, veritabanını yapılandırdık ve projeyi dağıttık.",
      "link": "https://dxp360.com/",
      "order_field": 6
    }
  },
  {
    "ID": "1a01328952b4",
    "title": "Pazardan",
    "image": "public/1729875780702_pazardan.svg",
    "description": "Pazardan is an online marketplace for ordering vegetables and fruits from local groceries. \n\nWe developed the mobile application with React Native, making it cross-platform for iOS and Android. The web platform was developed with React.js and Next.js.",
    "category": "cab37361e7e6",
    "link": "https://pazardan.app/",
    "order_field": 7,
    "status": "publish",
    "created_at": "2024-10-16T10:27:21.000Z",
    "updated_at": "2024-10-25T17:03:30.448Z",
    "scheduled": 0,
    "scheduled_at": null,
    "i18n": {
      "lang": "tr",
      "ID": "1a01328952b4",
      "created_at": "2024-10-16T10:27:21.000Z",
      "updated_at": "2024-10-25T17:03:30.451Z",
      "title": "Pazardan",
      "image": "public/1729875780702_pazardan.svg",
      "description": "Pazardan, yerel marketlerden sebze ve meyve siparişi vermek için bir çevrimiçi pazar yeridir.\n\nMobil uygulamayı React Native ile geliştirdik ve iOS ve Android için çapraz platform haline getirdik. Web platformu ise React.js ve Next.js ile geliştirildi.",
      "link": "https://pazardan.app/",
      "order_field": 7
    }
  }
]
```

### Sayfalama

```typescript
const paginatedItems = await queryWorkItemsPaginated(db, { limit: 3, offset: 1 });
```

```json
[
  {
    "ID": "8a8044e883e8",
    "title": "Contentrain",
    "image": "public/1729065603135_denemecontentrain.svg",
    "description": "Contentrain is a scalable content management platform combining Git and serverless platforms.\n\nWe planned the entire project workflow, designed the software architecture, developed the frontend and backend, structured the database, and integrated all components before deployment.",
    "category": "bcc834108adc",
    "link": "https://contentrain.io/",
    "order_field": 1,
    "status": "publish",
    "created_at": "2024-09-26T18:08:38.000Z",
    "updated_at": "2024-10-16T08:03:22.597Z",
    "scheduled": 0,
    "scheduled_at": null,
    "i18n": {
      "lang": "tr",
      "ID": "8a8044e883e8",
      "created_at": "2024-09-26T18:08:38.000Z",
      "updated_at": "2024-10-25T16:49:44.612Z",
      "title": "Contentrain",
      "image": "public/1729065603135_denemecontentrain.svg",
      "description": "Contentrain, Git ve serverless platformları birleştiren, ölçeklenebilir bir içerik yönetim platformudur.\n\nTüm proje iş akışını planladık, yazılım mimarisini tasarladık, frontend ve backend geliştirmelerini yaptık, veritabanını yapılandırdık ve tüm bileşenleri dağıtımdan önce entegre ettik.",
      "link": "https://contentrain.io/",
      "order_field": 1
    }
  },
  {
    "ID": "8a8044e883ec",
    "title": "DXP 360",
    "image": "public/1729074312031_dxp360.svg",
    "description": "DXP360 is an RFP (Request for Proposal) portal that aggregates RFPs from various sources, simplifying the proposal discovery and submission process for enterprises and agencies.\n\nWe designed the project plan based on client briefs, developed the frontend and backend, structured the database, and deployed the project.",
    "category": "bcc834108adc",
    "link": "https://dxp360.com/",
    "order_field": 6,
    "status": "publish",
    "created_at": "2024-09-26T18:08:38.000Z",
    "updated_at": "2024-10-16T10:27:04.241Z",
    "scheduled": 0,
    "scheduled_at": null,
    "i18n": {
      "lang": "tr",
      "ID": "8a8044e883ec",
      "created_at": "2024-09-26T18:08:38.000Z",
      "updated_at": "2024-10-16T10:27:04.245Z",
      "title": "DXP 360",
      "image": "public/1729074312031_dxp360.svg",
      "description": "DXP360, çeşitli kaynaklardan gelen RFP'leri bir araya getiren ve işletmeler ve ajanslar için teklif keşfi ve gönderim sürecini basitleştiren bir RFP (Teklif Talebi) portalıdır.\n\nProje planını müşteri brifinglerine göre tasarladık, ön ucu ve arka ucu geliştirdik, veritabanını yapılandırdık ve projeyi dağıttık.",
      "link": "https://dxp360.com/",
      "order_field": 6
    }
  },
  {
    "ID": "1a01328952b4",
    "title": "Pazardan",
    "image": "public/1729875780702_pazardan.svg",
    "description": "Pazardan is an online marketplace for ordering vegetables and fruits from local groceries. \n\nWe developed the mobile application with React Native, making it cross-platform for iOS and Android. The web platform was developed with React.js and Next.js.",
    "category": "cab37361e7e6",
    "link": "https://pazardan.app/",
    "order_field": 7,
    "status": "publish",
    "created_at": "2024-10-16T10:27:21.000Z",
    "updated_at": "2024-10-25T17:03:30.448Z",
    "scheduled": 0,
    "scheduled_at": null,
    "i18n": {
      "lang": "tr",
      "ID": "1a01328952b4",
      "created_at": "2024-10-16T10:27:21.000Z",
      "updated_at": "2024-10-25T17:03:30.451Z",
      "title": "Pazardan",
      "image": "public/1729875780702_pazardan.svg",
      "description": "Pazardan, yerel marketlerden sebze ve meyve siparişi vermek için bir çevrimiçi pazar yeridir.\n\nMobil uygulamayı React Native ile geliştirdik ve iOS ve Android için çapraz platform haline getirdik. Web platformu ise React.js ve Next.js ile geliştirildi.",
      "link": "https://pazardan.app/",
      "order_field": 7
    }
  }
]
```

## 2. İlişki Sorguları

### Testimonials ve Work Items

```typescript
const testimonialsWithWork = await queryTestimonialsWithWork(db);
```

```json
[
  {
    "ID": "89ae53eb8370",
    "name": "Ertuğrul Uçar",
    "description": "Lanista Software supported Popile’s frontend and backend in its early stages, helping us improve our work.",
    "title": "CEO, Popile",
    "image": "public/1728463995414_ertugrul.jpeg",
    "creative_work": "51bf2dbbed29",
    "status": "publish",
    "created_at": "2024-10-13T11:24:25.000Z",
    "updated_at": "2024-10-16T11:10:08.066Z",
    "scheduled": 0,
    "scheduled_at": null,
    "work_title": "Popile",
    "i18n": {
      "lang": "tr",
      "ID": "89ae53eb8370",
      "created_at": "2024-10-13T11:24:25.000Z",
      "updated_at": "2024-10-16T11:10:08.070Z",
      "name": "Ertuğrul Uçar",
      "description": "Lanista Software, Popile’nin ilk aşamalarında bize Frontend ve Backend tarafında destek oldu, bu da işimizi daha iyi hale getirmemizi sağladı.",
      "title": "CEO, Popile",
      "image": "public/1728463995414_ertugrul.jpeg"
    }
  },
  {
    "ID": "b770c71013d2",
    "name": "Murat Sus",
    "description": "The team has a great ability to resolve any problem by adapting innovative technologies and approaches.",
    "title": "Co-Founder, Bloom and Fresh",
    "image": "public/1729164933955_murat.png",
    "creative_work": "8a8044e883e9",
    "status": "publish",
    "created_at": "2024-10-16T11:26:26.000Z",
    "updated_at": "2024-10-17T11:37:05.703Z",
    "scheduled": 0,
    "scheduled_at": null,
    "work_title": "Bloom and Fresh",
    "i18n": {
      "lang": "tr",
      "ID": "b770c71013d2",
      "created_at": "2024-10-16T11:26:26.000Z",
      "updated_at": "2024-10-17T11:37:05.705Z",
      "name": "Murat Sus",
      "description": "Lanista ekibi, yenilikçi teknoloji ve yaklaşımları benimseyerek her türlü sorunu çözme konusunda büyük bir yeteneğe sahip.",
      "title": "Co-Founder, Bloom and Fresh",
      "image": "public/1729164933955_murat.png"
    }
  },
  {
    "ID": "c421eb634cfa",
    "name": "Ege Büyüktaşkın",
    "description": "Lanista Software worked closely with my team to bring my idea to life, making the whole process smooth.",
    "title": "Founder, Visivi",
    "image": "public/1728464446315_ege.jpeg",
    "creative_work": "8a8044e883eb",
    "status": "publish",
    "created_at": "2024-10-16T11:31:21.000Z",
    "updated_at": "2024-10-16T11:31:21.000Z",
    "scheduled": 0,
    "scheduled_at": null,
    "work_title": "Visivi",
    "i18n": {
      "lang": "tr",
      "ID": "c421eb634cfa",
      "created_at": "2024-10-16T11:31:21.000Z",
      "updated_at": "2024-10-16T11:31:21.000Z",
      "name": "Ege Büyüktaşkın",
      "description": "Lanista Yazılım, ekibimle yakın iş birliği içinde çalışarak fikrimi hayata geçirdi ve süreci çok daha kolay hale getirdi.",
      "title": "Kurucu, Visiv",
      "image": "public/1728464446315_ege.jpeg"
    }
  }
]
```

### Services ve Technologies

```typescript
const servicesWithTech = await queryServicesWithTechnologies(db);
```

```json
[
  {
    "ID": "50d81f2a3baf",
    "title": "Web App. Development",
    "description": "From concept to launch, we deliver custom web apps that are secure, scalable, and designed to meet your business needs.",
    "image": "public/1729868379116_Webapp.svg",
    "reference": "34e63b4829f0",
    "status": "publish",
    "created_at": "2024-10-14T10:32:18.000Z",
    "updated_at": "2024-10-25T15:00:08.321Z",
    "scheduled": 0,
    "scheduled_at": null,
    "tech_logos": "public/1728394907608_Popile.svg",
    "i18n": {
      "lang": "tr",
      "ID": "50d81f2a3baf",
      "created_at": "2024-10-14T10:32:18.000Z",
      "updated_at": "2024-10-25T15:00:08.323Z",
      "title": "Web Uygulama Geliştirme",
      "description": "Konseptten lansmana kadar güvenli, ölçeklenebilir ve iş ihtiyaçlarınızı karşılayacak şekilde tasarlanmış özel web uygulamaları geliştiriyoruz.",
      "image": "public/1729868379116_Webapp.svg"
    },
    "technologies": [
      "public/1728394907608_Popile.svg"
    ]
  },
  {
    "ID": "9450777bee2f",
    "title": "Mobile App. Development",
    "description": "We develop custom iOS and Android mobile apps to turn our clients' ideas into real mobile experiences.",
    "image": "public/1729765510539_Mobileapp.svg",
    "reference": "5c5955d57da8",
    "status": "publish",
    "created_at": "2024-10-14T10:33:10.000Z",
    "updated_at": "2024-10-24T10:27:07.330Z",
    "scheduled": 0,
    "scheduled_at": null,
    "tech_logos": "public/1728394892554_pazardan.svg",
    "i18n": {
      "lang": "tr",
      "ID": "9450777bee2f",
      "created_at": "2024-10-14T10:33:10.000Z",
      "updated_at": "2024-10-24T10:27:13.551Z",
      "title": "Mobil Uygulama Geliştirme",
      "description": "Müşterilerimizin fikirlerini gerçek mobil deneyimlere dönüştürebilmek için özel IOS ve Android uygulamalar geliştiriyoruz.",
      "image": "public/1729765510539_Mobileapp.svg"
    },
    "technologies": [
      "public/1728394892554_pazardan.svg"
    ]
  },
  {
    "ID": "d00761480436",
    "title": "MVP Development",
    "description": "Helping startups bring their ideas to life with MVP development services.",
    "image": "public/1729767526420_MVP.svg",
    "reference": "7fa159ae4aaf",
    "status": "publish",
    "created_at": "2024-09-26T18:04:41.000Z",
    "updated_at": "2024-10-24T10:59:32.680Z",
    "scheduled": 0,
    "scheduled_at": null,
    "tech_logos": "public/1728394876736_Contentrain.svg",
    "i18n": {
      "lang": "tr",
      "ID": "d00761480436",
      "created_at": "2024-09-26T18:04:41.000Z",
      "updated_at": "2024-10-24T10:59:32.684Z",
      "title": "MVP Geliştirme",
      "description": "Startuplara, fikirlerini hayata geçirebilmeleri için deneyimli bir ekiple birlikte MVP geliştirme hizmeti sunuyoruz.",
      "image": "public/1729767526420_MVP.svg"
    },
    "technologies": [
      "public/1728394876736_Contentrain.svg"
    ]
  },
  {
    "ID": "d00761480437",
    "title": "SaaS Platform Development",
    "description": "We provide end-to-end custom SaaS platform development solutions. ",
    "image": "public/1729844595854_SaaS.svg",
    "reference": null,
    "status": "publish",
    "created_at": "2024-09-26T18:04:41.000Z",
    "updated_at": "2024-10-25T08:24:14.428Z",
    "scheduled": 0,
    "scheduled_at": null,
    "tech_logos": null,
    "i18n": {
      "lang": "tr",
      "ID": "d00761480437",
      "created_at": "2024-09-26T18:04:41.000Z",
      "updated_at": "2024-10-25T08:24:14.431Z",
      "title": "SaaS Platform Geliştirme",
      "description": "Startuplara ve kurumsal firmalara ihtiyaç duydukları uçtan uca SaaS platform geliştirme çözümleri sağlıyoruz.",
      "image": "public/1729844595854_SaaS.svg"
    },
    "technologies": []
  },
  {
    "ID": "d00761480438",
    "title": "Product Design",
    "description": "Crafting product designs that blend functionality with modern aesthetics.",
    "image": "public/1729849903212_ProductDesign.svg",
    "reference": null,
    "status": "publish",
    "created_at": "2024-09-26T18:04:41.000Z",
    "updated_at": "2024-10-25T09:52:10.988Z",
    "scheduled": 0,
    "scheduled_at": null,
    "tech_logos": null,
    "i18n": {
      "lang": "tr",
      "ID": "d00761480438",
      "created_at": "2024-09-26T18:04:41.000Z",
      "updated_at": "2024-10-25T09:52:10.991Z",
      "title": "Ürün Tasarımı",
      "description": "İşlevselliği modern estetikle harmanlayan ürün tasarımları üretiyoruz.",
      "image": "public/1729849903212_ProductDesign.svg"
    },
    "technologies": []
  },
  {
    "ID": "d00761480439",
    "title": "Web Design & Development",
    "description": "Need high convertible websites? We craft responsive websites that attract and convert visitors.",
    "image": "public/1729856262454_Webdesign.svg",
    "reference": null,
    "status": "publish",
    "created_at": "2024-09-26T18:04:41.000Z",
    "updated_at": "2024-10-25T11:38:08.324Z",
    "scheduled": 0,
    "scheduled_at": null,
    "tech_logos": null,
    "i18n": {
      "lang": "tr",
      "ID": "d00761480439",
      "created_at": "2024-09-26T18:04:41.000Z",
      "updated_at": "2024-10-25T11:38:08.325Z",
      "title": "Web Tasarımı & Geliştirme",
      "description": "Ziyaretçilerinizi çekecek web sitelerine mi ihtiyacınız var? İşiniz için ölçeklenebilir ve responsive web siteleri geliştiriyoruz.",
      "image": "public/1729856262454_Webdesign.svg"
    },
    "technologies": []
  },
  {
    "ID": "d00761480440",
    "title": "Headless CMS Solutions",
    "description": "We develop custom Headless CMS solutions or integrate our own Git-based Headless CMS Contentrain into your projects.",
    "image": "public/1729867496804_Headless.svg",
    "reference": null,
    "status": "publish",
    "created_at": "2024-09-26T18:04:41.000Z",
    "updated_at": "2024-10-25T14:45:24.229Z",
    "scheduled": 0,
    "scheduled_at": null,
    "tech_logos": null,
    "i18n": {
      "lang": "tr",
      "ID": "d00761480440",
      "created_at": "2024-09-26T18:04:41.000Z",
      "updated_at": "2024-10-25T14:45:24.232Z",
      "title": "Headless CMS Çözümleri",
      "description": "Projeleriniz için CMS çözümleri geliştiriyor veya kendi ürünümüz olan Git tabanlı Contentrain'i projenize entegre ediyoruz.",
      "image": "public/1729867496804_Headless.svg"
    },
    "technologies": []
  }
]
```

## 3. Gelişmiş Sorgular

### Çoklu Filtreler

```typescript
const filteredItems = await queryWorkItemsWithFilters(db, {
  search: 'platform',
  category: 'web'
});
```

```json
[]
```

## 4. Çoklu Dil ve İlişki Senaryoları

### Services ve References (TR)

```typescript
const servicesWithRefsTR = await queryServicesWithReferences(db, { lang: 'tr' });
```

```json
[
  {
    "ID": "50d81f2a3baf",
    "title": "Web App. Development",
    "description": "From concept to launch, we deliver custom web apps that are secure, scalable, and designed to meet your business needs.",
    "image": "public/1729868379116_Webapp.svg",
    "reference": "34e63b4829f0",
    "status": "publish",
    "created_at": "2024-10-14T10:32:18.000Z",
    "updated_at": "2024-10-25T15:00:08.321Z",
    "scheduled": 0,
    "scheduled_at": null,
    "reference_logo": "public/1728394907608_Popile.svg",
    "i18n": {
      "lang": "tr",
      "ID": "50d81f2a3baf",
      "created_at": "2024-10-14T10:32:18.000Z",
      "updated_at": "2024-10-25T15:00:08.323Z",
      "title": "Web Uygulama Geliştirme",
      "description": "Konseptten lansmana kadar güvenli, ölçeklenebilir ve iş ihtiyaçlarınızı karşılayacak şekilde tasarlanmış özel web uygulamaları geliştiriyoruz.",
      "image": "public/1729868379116_Webapp.svg"
    }
  },
  {
    "ID": "9450777bee2f",
    "title": "Mobile App. Development",
    "description": "We develop custom iOS and Android mobile apps to turn our clients' ideas into real mobile experiences.",
    "image": "public/1729765510539_Mobileapp.svg",
    "reference": "5c5955d57da8",
    "status": "publish",
    "created_at": "2024-10-14T10:33:10.000Z",
    "updated_at": "2024-10-24T10:27:07.330Z",
    "scheduled": 0,
    "scheduled_at": null,
    "reference_logo": "public/1728394892554_pazardan.svg",
    "i18n": {
      "lang": "tr",
      "ID": "9450777bee2f",
      "created_at": "2024-10-14T10:33:10.000Z",
      "updated_at": "2024-10-24T10:27:13.551Z",
      "title": "Mobil Uygulama Geliştirme",
      "description": "Müşterilerimizin fikirlerini gerçek mobil deneyimlere dönüştürebilmek için özel IOS ve Android uygulamalar geliştiriyoruz.",
      "image": "public/1729765510539_Mobileapp.svg"
    }
  },
  {
    "ID": "d00761480436",
    "title": "MVP Development",
    "description": "Helping startups bring their ideas to life with MVP development services.",
    "image": "public/1729767526420_MVP.svg",
    "reference": "7fa159ae4aaf",
    "status": "publish",
    "created_at": "2024-09-26T18:04:41.000Z",
    "updated_at": "2024-10-24T10:59:32.680Z",
    "scheduled": 0,
    "scheduled_at": null,
    "reference_logo": "public/1728394876736_Contentrain.svg",
    "i18n": {
      "lang": "tr",
      "ID": "d00761480436",
      "created_at": "2024-09-26T18:04:41.000Z",
      "updated_at": "2024-10-24T10:59:32.684Z",
      "title": "MVP Geliştirme",
      "description": "Startuplara, fikirlerini hayata geçirebilmeleri için deneyimli bir ekiple birlikte MVP geliştirme hizmeti sunuyoruz.",
      "image": "public/1729767526420_MVP.svg"
    }
  },
  {
    "ID": "d00761480437",
    "title": "SaaS Platform Development",
    "description": "We provide end-to-end custom SaaS platform development solutions. ",
    "image": "public/1729844595854_SaaS.svg",
    "reference": null,
    "status": "publish",
    "created_at": "2024-09-26T18:04:41.000Z",
    "updated_at": "2024-10-25T08:24:14.428Z",
    "scheduled": 0,
    "scheduled_at": null,
    "reference_logo": null,
    "i18n": {
      "lang": "tr",
      "ID": "d00761480437",
      "created_at": "2024-09-26T18:04:41.000Z",
      "updated_at": "2024-10-25T08:24:14.431Z",
      "title": "SaaS Platform Geliştirme",
      "description": "Startuplara ve kurumsal firmalara ihtiyaç duydukları uçtan uca SaaS platform geliştirme çözümleri sağlıyoruz.",
      "image": "public/1729844595854_SaaS.svg"
    }
  },
  {
    "ID": "d00761480438",
    "title": "Product Design",
    "description": "Crafting product designs that blend functionality with modern aesthetics.",
    "image": "public/1729849903212_ProductDesign.svg",
    "reference": null,
    "status": "publish",
    "created_at": "2024-09-26T18:04:41.000Z",
    "updated_at": "2024-10-25T09:52:10.988Z",
    "scheduled": 0,
    "scheduled_at": null,
    "reference_logo": null,
    "i18n": {
      "lang": "tr",
      "ID": "d00761480438",
      "created_at": "2024-09-26T18:04:41.000Z",
      "updated_at": "2024-10-25T09:52:10.991Z",
      "title": "Ürün Tasarımı",
      "description": "İşlevselliği modern estetikle harmanlayan ürün tasarımları üretiyoruz.",
      "image": "public/1729849903212_ProductDesign.svg"
    }
  },
  {
    "ID": "d00761480439",
    "title": "Web Design & Development",
    "description": "Need high convertible websites? We craft responsive websites that attract and convert visitors.",
    "image": "public/1729856262454_Webdesign.svg",
    "reference": null,
    "status": "publish",
    "created_at": "2024-09-26T18:04:41.000Z",
    "updated_at": "2024-10-25T11:38:08.324Z",
    "scheduled": 0,
    "scheduled_at": null,
    "reference_logo": null,
    "i18n": {
      "lang": "tr",
      "ID": "d00761480439",
      "created_at": "2024-09-26T18:04:41.000Z",
      "updated_at": "2024-10-25T11:38:08.325Z",
      "title": "Web Tasarımı & Geliştirme",
      "description": "Ziyaretçilerinizi çekecek web sitelerine mi ihtiyacınız var? İşiniz için ölçeklenebilir ve responsive web siteleri geliştiriyoruz.",
      "image": "public/1729856262454_Webdesign.svg"
    }
  },
  {
    "ID": "d00761480440",
    "title": "Headless CMS Solutions",
    "description": "We develop custom Headless CMS solutions or integrate our own Git-based Headless CMS Contentrain into your projects.",
    "image": "public/1729867496804_Headless.svg",
    "reference": null,
    "status": "publish",
    "created_at": "2024-09-26T18:04:41.000Z",
    "updated_at": "2024-10-25T14:45:24.229Z",
    "scheduled": 0,
    "scheduled_at": null,
    "reference_logo": null,
    "i18n": {
      "lang": "tr",
      "ID": "d00761480440",
      "created_at": "2024-09-26T18:04:41.000Z",
      "updated_at": "2024-10-25T14:45:24.232Z",
      "title": "Headless CMS Çözümleri",
      "description": "Projeleriniz için CMS çözümleri geliştiriyor veya kendi ürünümüz olan Git tabanlı Contentrain'i projenize entegre ediyoruz.",
      "image": "public/1729867496804_Headless.svg"
    }
  }
]
```

### Services ve References (EN)

```typescript
const servicesWithRefsEN = await queryServicesWithReferences(db);
```

```json
[
  {
    "ID": "50d81f2a3baf",
    "title": "Web App. Development",
    "description": "From concept to launch, we deliver custom web apps that are secure, scalable, and designed to meet your business needs.",
    "image": "public/1729868379116_Webapp.svg",
    "reference": "34e63b4829f0",
    "status": "publish",
    "created_at": "2024-10-14T10:32:18.000Z",
    "updated_at": "2024-10-25T15:00:08.321Z",
    "scheduled": 0,
    "scheduled_at": null,
    "reference_logo": "public/1728394907608_Popile.svg"
  },
  {
    "ID": "9450777bee2f",
    "title": "Mobile App. Development",
    "description": "We develop custom iOS and Android mobile apps to turn our clients' ideas into real mobile experiences.",
    "image": "public/1729765510539_Mobileapp.svg",
    "reference": "5c5955d57da8",
    "status": "publish",
    "created_at": "2024-10-14T10:33:10.000Z",
    "updated_at": "2024-10-24T10:27:07.330Z",
    "scheduled": 0,
    "scheduled_at": null,
    "reference_logo": "public/1728394892554_pazardan.svg"
  },
  {
    "ID": "d00761480436",
    "title": "MVP Development",
    "description": "Helping startups bring their ideas to life with MVP development services.",
    "image": "public/1729767526420_MVP.svg",
    "reference": "7fa159ae4aaf",
    "status": "publish",
    "created_at": "2024-09-26T18:04:41.000Z",
    "updated_at": "2024-10-24T10:59:32.680Z",
    "scheduled": 0,
    "scheduled_at": null,
    "reference_logo": "public/1728394876736_Contentrain.svg"
  },
  {
    "ID": "d00761480437",
    "title": "SaaS Platform Development",
    "description": "We provide end-to-end custom SaaS platform development solutions. ",
    "image": "public/1729844595854_SaaS.svg",
    "reference": null,
    "status": "publish",
    "created_at": "2024-09-26T18:04:41.000Z",
    "updated_at": "2024-10-25T08:24:14.428Z",
    "scheduled": 0,
    "scheduled_at": null,
    "reference_logo": null
  },
  {
    "ID": "d00761480438",
    "title": "Product Design",
    "description": "Crafting product designs that blend functionality with modern aesthetics.",
    "image": "public/1729849903212_ProductDesign.svg",
    "reference": null,
    "status": "publish",
    "created_at": "2024-09-26T18:04:41.000Z",
    "updated_at": "2024-10-25T09:52:10.988Z",
    "scheduled": 0,
    "scheduled_at": null,
    "reference_logo": null
  },
  {
    "ID": "d00761480439",
    "title": "Web Design & Development",
    "description": "Need high convertible websites? We craft responsive websites that attract and convert visitors.",
    "image": "public/1729856262454_Webdesign.svg",
    "reference": null,
    "status": "publish",
    "created_at": "2024-09-26T18:04:41.000Z",
    "updated_at": "2024-10-25T11:38:08.324Z",
    "scheduled": 0,
    "scheduled_at": null,
    "reference_logo": null
  },
  {
    "ID": "d00761480440",
    "title": "Headless CMS Solutions",
    "description": "We develop custom Headless CMS solutions or integrate our own Git-based Headless CMS Contentrain into your projects.",
    "image": "public/1729867496804_Headless.svg",
    "reference": null,
    "status": "publish",
    "created_at": "2024-09-26T18:04:41.000Z",
    "updated_at": "2024-10-25T14:45:24.229Z",
    "scheduled": 0,
    "scheduled_at": null,
    "reference_logo": null
  }
]
```

### Sociallinks ve Services

```typescript
const socialLinksWithServices = await querySocialLinksWithServices(db);
```

```json
[
  {
    "ID": "2aa54f9e7eaf",
    "link": "https://www.linkedin.com/company/lanista-software",
    "icon": "ri-linkedin-line",
    "service": "50d81f2a3baf",
    "status": "publish",
    "created_at": "2024-09-26T18:05:14.000Z",
    "updated_at": "2024-10-22T10:40:07.059Z",
    "scheduled": 0,
    "scheduled_at": null,
    "service_title": "Web App. Development"
  },
  {
    "ID": "2aa54f9e7eb1",
    "link": "https://x.com/lanistasoftware",
    "icon": "ri-twitter-line",
    "service": "9450777bee2f",
    "status": "publish",
    "created_at": "2024-09-26T18:05:14.000Z",
    "updated_at": "2024-10-22T09:35:21.910Z",
    "scheduled": 0,
    "scheduled_at": null,
    "service_title": "Mobile App. Development"
  },
  {
    "ID": "2aa54f9e7eb2",
    "link": "https://www.instagram.com/lanistasoftware/",
    "icon": "ri-instagram-line",
    "service": "d00761480436",
    "status": "publish",
    "created_at": "2024-09-26T18:05:14.000Z",
    "updated_at": "2024-10-22T10:40:07.066Z",
    "scheduled": 0,
    "scheduled_at": null,
    "service_title": "MVP Development"
  }
]
```

