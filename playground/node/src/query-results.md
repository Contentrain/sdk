# Contentrain SDK Sorgu Örnekleri ve Sonuçları

## Örnek 1: Süreçleri Başlığa Göre Sıralama ve Limit Uygulama
```typescript
sdk.query<IProcessItems>('processes')
  .orderBy('title', 'asc')
  .limit(3)
  .get();
```

<results>
[
  {
    "ID": "96c64803d442",
    "createdAt": "2024-09-26T13:59:00.000Z",
    "updatedAt": "2024-10-14T07:34:08.032Z",
    "status": "publish",
    "title": "Design & Prototyping",
    "description": "We turn ideas into great designs based on each project’s goals, refining them through client feedback and iterations.",
    "icon": "ri-shape-line",
    "scheduled": false
  },
  {
    "ID": "96c64803d443",
    "createdAt": "2024-09-26T13:59:00.000Z",
    "updatedAt": "2024-10-14T07:34:08.040Z",
    "status": "publish",
    "title": "Development Stage",
    "description": "We transform designs into fully functional software, integrating key features and making sure the system is ready for testing.",
    "icon": "ri-terminal-box-line",
    "scheduled": false
  },
  {
    "ID": "96c64803d445",
    "createdAt": "2024-09-26T13:59:00.000Z",
    "updatedAt": "2024-10-14T07:34:08.051Z",
    "status": "publish",
    "title": "Project Deployment",
    "description": "We deploy the project to a live environment with the right structure, ensuring the product is ready for end users.",
    "icon": "ri-rocket-line",
    "scheduled": false
  }
]
</results>

## Örnek 2: İş Öğeleri ve Kategorilerini Çekme
```typescript
sdk.query<IWorkItem>('workitems')
  .include('category')
  .orderBy('order', 'asc')
  .get();
```

<results>
[
  {
    "ID": "8a8044e883e8",
    "createdAt": "2024-09-26T18:08:38.000Z",
    "updatedAt": "2024-10-16T08:03:22.597Z",
    "status": "publish",
    "title": "Contentrain",
    "image": "public/1729065603135_denemecontentrain.svg",
    "description": "Contentrain is a scalable content management platform combining Git and serverless platforms.\n\nWe planned the entire project workflow, designed the software architecture, developed the frontend and backend, structured the database, and integrated all components before deployment.",
    "category": "bcc834108adc",
    "link": "https://contentrain.io/",
    "scheduled": false,
    "order": 1,
    "_relations": {
      "category": {
        "ID": "bcc834108adc",
        "createdAt": "Wed Oct 16 2024 11:02:51 GMT+0300 (GMT+03:00)",
        "updatedAt": "Wed Oct 16 2024 11:02:51 GMT+0300 (GMT+03:00)",
        "category": "Product Development",
        "status": "publish",
        "scheduled": false,
        "order": 9
      }
    }
  },
  {
    "ID": "8a8044e883e9",
    "createdAt": "2024-09-26T18:08:38.000Z",
    "updatedAt": "2024-10-25T16:38:01.208Z",
    "status": "publish",
    "title": "Bloom and Fresh",
    "image": "public/1729874043253_Bloomandfresh.svg",
    "description": "Bloom & Fresh is an eCommerce platform specializing in floral arrangements and gifts.\n\nWe modernized the frontend with Vue.js and Nuxt.js, integrating it with the client's existing backend system.",
    "category": "cab37361e7e6",
    "link": "https://bloomandfresh.com",
    "order": 2,
    "scheduled": false,
    "_relations": {
      "category": {
        "ID": "cab37361e7e6",
        "createdAt": "Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00)",
        "updatedAt": "Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00)",
        "category": "Frontend Development",
        "status": "publish",
        "scheduled": false,
        "order": 1
      }
    }
  },
  {
    "ID": "8a8044e883ea",
    "createdAt": "2024-09-26T18:08:38.000Z",
    "updatedAt": "2024-10-16T08:13:12.448Z",
    "status": "publish",
    "title": "Wordify",
    "image": "public/1729066309718_wordify.svg",
    "description": "We transformed Wordify's Squarespace-based website into a custom site using Jamstack architecture. This upgrade provided Wordify with a smooth look, enhanced performance, scalability, and improved user experience.",
    "category": "cab37361e7ea",
    "link": "https://www.wordify.co/",
    "scheduled": false,
    "order": 3,
    "_relations": {
      "category": {
        "ID": "cab37361e7ea",
        "createdAt": "Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00)",
        "updatedAt": "Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00)",
        "category": "Social Media Marketing",
        "status": "publish",
        "scheduled": false,
        "order": 5
      }
    }
  },
  {
    "ID": "51bf2dbbed29",
    "createdAt": "2024-10-16T10:45:44.000Z",
    "updatedAt": "2024-10-25T16:45:21.855Z",
    "status": "publish",
    "title": "Popile",
    "image": "public/1729874670881_popile.svg",
    "description": "Popile is the meeting point of data and creativity in influencer marketing. We made improvements on the frontend using Vue.js, supported payment system integrations, and optimized the backend for better performance.",
    "category": "8ac7d8c79484",
    "link": "https://www.popile.com/",
    "order": 4,
    "scheduled": false,
    "_relations": {
      "category": {
        "ID": "8ac7d8c79484",
        "createdAt": "Wed Oct 16 2024 13:49:43 GMT+0300 (GMT+03:00)",
        "updatedAt": "Wed Oct 16 2024 13:49:43 GMT+0300 (GMT+03:00)",
        "category": "Support & Maintenance",
        "status": "publish",
        "scheduled": false,
        "order": 7
      }
    }
  },
  {
    "ID": "8a8044e883eb",
    "createdAt": "2024-09-26T18:08:38.000Z",
    "updatedAt": "2024-10-16T10:22:34.812Z",
    "status": "publish",
    "title": "Visivi",
    "image": "public/1729074133746_visivi.svg",
    "description": "Visivi is an HR platform with both mobile and web portals. \n\nWe developed the mobile application with React Native, making it cross-platform for both iOS and Android. For the web portal, we used Nuxt.js and Vue.js.",
    "category": "bcc834108adc",
    "link": "https://visivi.co/",
    "scheduled": false,
    "order": 5,
    "_relations": {
      "category": {
        "ID": "bcc834108adc",
        "createdAt": "Wed Oct 16 2024 11:02:51 GMT+0300 (GMT+03:00)",
        "updatedAt": "Wed Oct 16 2024 11:02:51 GMT+0300 (GMT+03:00)",
        "category": "Product Development",
        "status": "publish",
        "scheduled": false,
        "order": 9
      }
    }
  },
  {
    "ID": "8a8044e883ec",
    "createdAt": "2024-09-26T18:08:38.000Z",
    "updatedAt": "2024-10-16T10:27:04.241Z",
    "status": "publish",
    "title": "DXP 360",
    "image": "public/1729074312031_dxp360.svg",
    "description": "DXP360 is an RFP (Request for Proposal) portal that aggregates RFPs from various sources, simplifying the proposal discovery and submission process for enterprises and agencies.\n\nWe designed the project plan based on client briefs, developed the frontend and backend, structured the database, and deployed the project.",
    "category": "bcc834108adc",
    "link": "https://dxp360.com/",
    "scheduled": false,
    "order": 6,
    "_relations": {
      "category": {
        "ID": "bcc834108adc",
        "createdAt": "Wed Oct 16 2024 11:02:51 GMT+0300 (GMT+03:00)",
        "updatedAt": "Wed Oct 16 2024 11:02:51 GMT+0300 (GMT+03:00)",
        "category": "Product Development",
        "status": "publish",
        "scheduled": false,
        "order": 9
      }
    }
  },
  {
    "ID": "1a01328952b4",
    "createdAt": "2024-10-16T10:27:21.000Z",
    "updatedAt": "2024-10-25T17:03:30.448Z",
    "status": "publish",
    "title": "Pazardan",
    "image": "public/1729875780702_pazardan.svg",
    "description": "Pazardan is an online marketplace for ordering vegetables and fruits from local groceries. \n\nWe developed the mobile application with React Native, making it cross-platform for iOS and Android. The web platform was developed with React.js and Next.js.",
    "category": "cab37361e7e6",
    "link": "https://pazardan.app/",
    "order": 7,
    "scheduled": false,
    "_relations": {
      "category": {
        "ID": "cab37361e7e6",
        "createdAt": "Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00)",
        "updatedAt": "Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00)",
        "category": "Frontend Development",
        "status": "publish",
        "scheduled": false,
        "order": 1
      }
    }
  }
]
</results>

## Örnek 3: Yayındaki SSS Öğelerini Filtreleme
```typescript
sdk.query<IFaqItem>('faqitems')
  .where('status', 'eq', 'publish')
  .orderBy('order', 'asc')
  .get();
```

<results>
[
  {
    "ID": "951c49ca05b9",
    "createdAt": "2024-10-10T06:20:32.000Z",
    "updatedAt": "2024-10-13T09:27:06.080Z",
    "status": "publish",
    "question": "What does Lanista Software specialize in?",
    "answer": "At Lanista Software, we develop custom web and mobile apps for different businesses. With expertise in end-to-end product development, we also help startups to create solid MVPs.",
    "order": 1,
    "scheduled": false
  },
  {
    "ID": "a528b01b5689",
    "createdAt": "2024-09-26T13:57:30.000Z",
    "updatedAt": "2024-10-13T11:15:52.865Z",
    "status": "publish",
    "question": "What industries does Lanista Software serve?",
    "answer": "We develop high-performance software solutions for industries like saas, e-commerce, healthcare, finance, education, retail, media, manufacturing, automotive and HR services. ",
    "order": 2,
    "scheduled": false
  },
  {
    "ID": "a528b01b5690",
    "createdAt": "2024-09-26T13:57:30.000Z",
    "updatedAt": "2024-10-13T09:27:06.095Z",
    "status": "publish",
    "question": "How does the software product development process work?",
    "answer": "We begin by understanding your goals, then research, plan and create a prototype. After approval, we proceed with development, testing and deployment, keeping you involved throughout.",
    "order": 3,
    "scheduled": false
  },
  {
    "ID": "a528b01b5691",
    "createdAt": "2024-09-26T13:57:30.000Z",
    "updatedAt": "2024-10-13T11:17:21.428Z",
    "status": "publish",
    "question": "How long does it take to develop a software product?",
    "answer": "Geliştirme zaman çizelgesi projenin karmaşıklığına ve kapsamına bağlıdır. Hedeflerinizi analiz ettikten sonra, projeye başlamadan önce size ayrıntılı bir zaman çizelgesi sunuyoruz.",
    "order": 4,
    "scheduled": false
  },
  {
    "ID": "a528b01b5692",
    "createdAt": "2024-09-26T13:57:30.000Z",
    "updatedAt": "2024-10-13T09:39:55.154Z",
    "status": "publish",
    "question": "What if I want to make changes to the project after development starts?",
    "answer": "We understand that new ideas can emerge during development. Our agile approach allows flexibility for changes, and we assess the impact on timelines and budget before moving forward.",
    "order": 5,
    "scheduled": false
  },
  {
    "ID": "a528b01b5693",
    "createdAt": "2024-09-26T13:57:30.000Z",
    "updatedAt": "2024-10-13T10:52:20.340Z",
    "status": "publish",
    "question": "How often will I receive updates about my project from the team?",
    "answer": "We believe in transparent communication throughout the development process. You can get regular updates through weekly meetings, progress reports, and demos at key milestones.",
    "order": 6,
    "scheduled": false
  },
  {
    "ID": "0c1b5726fbf6",
    "createdAt": "2024-10-13T09:47:51.000Z",
    "updatedAt": "2024-10-13T10:53:47.055Z",
    "status": "publish",
    "question": "Do you offer technical support and maintenance services after delivering the project?",
    "answer": "Yes, we provide ongoing technical support and maintenance services to ensure your product runs smoothly. Our support includes bug fixes, updates, and feature enhancements.",
    "order": 7,
    "scheduled": false
  },
  {
    "ID": "bdf371e875c4",
    "createdAt": "Sun Oct 13 2024 12:59:04 GMT+0300 (GMT+03:00)",
    "updatedAt": "Sun Oct 13 2024 12:59:04 GMT+0300 (GMT+03:00)",
    "question": "What is your pricing model?",
    "answer": "We offer flexible pricing based on your project needs, including fixed-price contracts for well-defined projects or hourly rates for more dynamic ones.",
    "order": 8,
    "status": "publish",
    "scheduled": false
  },
  {
    "ID": "9afcecd11af9",
    "createdAt": "Sun Oct 13 2024 13:04:58 GMT+0300 (GMT+03:00)",
    "updatedAt": "Sun Oct 13 2024 13:04:58 GMT+0300 (GMT+03:00)",
    "question": "Can you help with app ideas and structure?",
    "answer": "Absolutely. We collaborate closely with clients to refine ideas and develop app structure, providing insights into user experience, functionality, and technical feasibility.",
    "order": 9,
    "status": "publish",
    "scheduled": false
  },
  {
    "ID": "7d33292fa865",
    "createdAt": "2024-10-13T10:16:28.000Z",
    "updatedAt": "2024-10-13T11:03:34.276Z",
    "status": "publish",
    "question": "Can you integrate 3rd party app services into my existing project?",
    "answer": "Our team is skilled in integrating 3rd party solutions with existing systems. Whether it’s APIs or 3rd platforms we provide seamless integrations to enhance your digital ecosystem.",
    "order": 10,
    "scheduled": false
  },
  {
    "ID": "c7ea2d6becc4",
    "createdAt": "Sun Oct 13 2024 13:22:27 GMT+0300 (GMT+03:00)",
    "updatedAt": "Sun Oct 13 2024 13:22:27 GMT+0300 (GMT+03:00)",
    "question": "Why do I need custom software?",
    "answer": "Custom software meets your business’s unique requirements. It offers flexibility, scalability, and seamless integration with existing processes, providing better user experience.",
    "order": 11,
    "status": "publish",
    "scheduled": false
  }
]
</results>

## Örnek 4: 'og' ile Başlayan Meta Etiketlerini Filtreleme
```typescript
sdk.query<IMetaTag>('meta-tags')
  .where('name', 'startsWith', 'og')
  .get();
```

<results>
[
  {
    "ID": "02135e680b44",
    "createdAt": "Mon Apr 29 2024 14:35:46 GMT+0300 (GMT+03:00)",
    "updatedAt": "2024-10-18T09:28:17.255Z",
    "name": "ogType",
    "content": "website",
    "description": "default",
    "status": "publish",
    "scheduled": false
  },
  {
    "ID": "196caf507337",
    "createdAt": "2024-04-29T11:37:02.000Z",
    "updatedAt": "2024-10-18T09:28:17.267Z",
    "status": "publish",
    "name": "ogTitle",
    "content": "Lanista | Web and Mobile App. development partner",
    "description": "defalt",
    "scheduled": false
  },
  {
    "ID": "9f3fb78abf01",
    "createdAt": "2024-04-29T11:38:01.000Z",
    "updatedAt": "2024-10-18T09:28:17.342Z",
    "status": "publish",
    "name": "ogSiteName",
    "content": "Lanista | Web and Mobile App. development partner",
    "description": "default",
    "scheduled": false
  },
  {
    "ID": "dc2539d45a50",
    "createdAt": "2024-04-29T11:36:05.000Z",
    "updatedAt": "2024-10-18T09:28:17.380Z",
    "status": "publish",
    "name": "ogImage",
    "content": "https://res.cloudinary.com/dmywgn45o/image/upload/v1729243091/lanista_og_chgpop.jpg",
    "description": "default",
    "scheduled": false
  },
  {
    "ID": "de2b9bd58b75",
    "createdAt": "2024-04-29T11:36:39.000Z",
    "updatedAt": "2024-10-18T09:28:17.385Z",
    "status": "publish",
    "name": "ogDescription",
    "content": "We provide end-to-end outsourced web and mobile application development services to drive your business's growth in today's digital world.",
    "description": "default",
    "scheduled": false
  }
]
</results>

## Örnek 5: İngilizce Referansları ve İlişkili İş Öğelerini Çekme
```typescript
sdk.query<ITestimonialItem>('testimonail-items')
  .locale('en')
  .where('status', 'eq', 'publish')
  .get();
```

<results>
[
  {
    "ID": "89ae53eb8370",
    "createdAt": "2024-10-13T11:24:25.000Z",
    "updatedAt": "2024-10-16T11:10:08.066Z",
    "status": "publish",
    "name": "Ertuğrul Uçar",
    "description": "Lanista Software supported Popile’s frontend and backend in its early stages, helping us improve our work.",
    "image": "public/1728463995414_ertugrul.jpeg",
    "title": "CEO, Popile",
    "creative-work": "51bf2dbbed29",
    "scheduled": false,
    "_relations": {
      "creative-work": {
        "ID": "51bf2dbbed29",
        "createdAt": "2024-10-16T10:45:44.000Z",
        "updatedAt": "2024-10-25T16:45:21.855Z",
        "status": "publish",
        "title": "Popile",
        "image": "public/1729874670881_popile.svg",
        "description": "Popile is the meeting point of data and creativity in influencer marketing. We made improvements on the frontend using Vue.js, supported payment system integrations, and optimized the backend for better performance.",
        "category": "8ac7d8c79484",
        "link": "https://www.popile.com/",
        "order": 4,
        "scheduled": false,
        "_relations": {
          "category": {
            "ID": "8ac7d8c79484",
            "createdAt": "Wed Oct 16 2024 13:49:43 GMT+0300 (GMT+03:00)",
            "updatedAt": "Wed Oct 16 2024 13:49:43 GMT+0300 (GMT+03:00)",
            "category": "Support & Maintenance",
            "status": "publish",
            "scheduled": false,
            "order": 7
          }
        }
      }
    }
  },
  {
    "ID": "b770c71013d2",
    "createdAt": "2024-10-16T11:26:26.000Z",
    "updatedAt": "2024-10-17T11:37:05.703Z",
    "status": "publish",
    "name": "Murat Sus",
    "description": "The team has a great ability to resolve any problem by adapting innovative technologies and approaches.",
    "image": "public/1729164933955_murat.png",
    "title": "Co-Founder, Bloom and Fresh",
    "creative-work": "8a8044e883e9",
    "scheduled": false,
    "_relations": {
      "creative-work": {
        "ID": "8a8044e883e9",
        "createdAt": "2024-09-26T18:08:38.000Z",
        "updatedAt": "2024-10-25T16:38:01.208Z",
        "status": "publish",
        "title": "Bloom and Fresh",
        "image": "public/1729874043253_Bloomandfresh.svg",
        "description": "Bloom & Fresh is an eCommerce platform specializing in floral arrangements and gifts.\n\nWe modernized the frontend with Vue.js and Nuxt.js, integrating it with the client's existing backend system.",
        "category": "cab37361e7e6",
        "link": "https://bloomandfresh.com",
        "order": 2,
        "scheduled": false,
        "_relations": {
          "category": {
            "ID": "cab37361e7e6",
            "createdAt": "Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00)",
            "updatedAt": "Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00)",
            "category": "Frontend Development",
            "status": "publish",
            "scheduled": false,
            "order": 1
          }
        }
      }
    }
  },
  {
    "ID": "c421eb634cfa",
    "createdAt": "Wed Oct 16 2024 14:31:21 GMT+0300 (GMT+03:00)",
    "updatedAt": "Wed Oct 16 2024 14:31:21 GMT+0300 (GMT+03:00)",
    "name": "Ege Büyüktaşkın",
    "description": "Lanista Software worked closely with my team to bring my idea to life, making the whole process smooth.",
    "image": "public/1728464446315_ege.jpeg",
    "title": "Founder, Visivi",
    "status": "publish",
    "creative-work": "8a8044e883eb",
    "scheduled": false,
    "_relations": {
      "creative-work": {
        "ID": "8a8044e883eb",
        "createdAt": "2024-09-26T18:08:38.000Z",
        "updatedAt": "2024-10-16T10:22:34.812Z",
        "status": "publish",
        "title": "Visivi",
        "image": "public/1729074133746_visivi.svg",
        "description": "Visivi is an HR platform with both mobile and web portals. \n\nWe developed the mobile application with React Native, making it cross-platform for both iOS and Android. For the web portal, we used Nuxt.js and Vue.js.",
        "category": "bcc834108adc",
        "link": "https://visivi.co/",
        "scheduled": false,
        "order": 5,
        "_relations": {
          "category": {
            "ID": "bcc834108adc",
            "createdAt": "Wed Oct 16 2024 11:02:51 GMT+0300 (GMT+03:00)",
            "updatedAt": "Wed Oct 16 2024 11:02:51 GMT+0300 (GMT+03:00)",
            "category": "Product Development",
            "status": "publish",
            "scheduled": false,
            "order": 9
          }
        }
      }
    }
  }
]
</results>

## Örnek 6: Yayındaki ve Sırası 0'dan Büyük İş Öğelerini Filtreleme
```typescript
sdk.query<IWorkItem>('workitems')
  .where('status', 'eq', 'publish')
  .where('order', 'gt', 0)
  .orderBy('order', 'asc')
  .limit(5)
  .get();
```

<results>
[
  {
    "ID": "8a8044e883e8",
    "createdAt": "2024-09-26T18:08:38.000Z",
    "updatedAt": "2024-10-16T08:03:22.597Z",
    "status": "publish",
    "title": "Contentrain",
    "image": "public/1729065603135_denemecontentrain.svg",
    "description": "Contentrain is a scalable content management platform combining Git and serverless platforms.\n\nWe planned the entire project workflow, designed the software architecture, developed the frontend and backend, structured the database, and integrated all components before deployment.",
    "category": "bcc834108adc",
    "link": "https://contentrain.io/",
    "scheduled": false,
    "order": 1,
    "_relations": {
      "category": {
        "ID": "bcc834108adc",
        "createdAt": "Wed Oct 16 2024 11:02:51 GMT+0300 (GMT+03:00)",
        "updatedAt": "Wed Oct 16 2024 11:02:51 GMT+0300 (GMT+03:00)",
        "category": "Product Development",
        "status": "publish",
        "scheduled": false,
        "order": 9
      }
    }
  },
  {
    "ID": "8a8044e883e9",
    "createdAt": "2024-09-26T18:08:38.000Z",
    "updatedAt": "2024-10-25T16:38:01.208Z",
    "status": "publish",
    "title": "Bloom and Fresh",
    "image": "public/1729874043253_Bloomandfresh.svg",
    "description": "Bloom & Fresh is an eCommerce platform specializing in floral arrangements and gifts.\n\nWe modernized the frontend with Vue.js and Nuxt.js, integrating it with the client's existing backend system.",
    "category": "cab37361e7e6",
    "link": "https://bloomandfresh.com",
    "order": 2,
    "scheduled": false,
    "_relations": {
      "category": {
        "ID": "cab37361e7e6",
        "createdAt": "Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00)",
        "updatedAt": "Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00)",
        "category": "Frontend Development",
        "status": "publish",
        "scheduled": false,
        "order": 1
      }
    }
  },
  {
    "ID": "8a8044e883ea",
    "createdAt": "2024-09-26T18:08:38.000Z",
    "updatedAt": "2024-10-16T08:13:12.448Z",
    "status": "publish",
    "title": "Wordify",
    "image": "public/1729066309718_wordify.svg",
    "description": "We transformed Wordify's Squarespace-based website into a custom site using Jamstack architecture. This upgrade provided Wordify with a smooth look, enhanced performance, scalability, and improved user experience.",
    "category": "cab37361e7ea",
    "link": "https://www.wordify.co/",
    "scheduled": false,
    "order": 3,
    "_relations": {
      "category": {
        "ID": "cab37361e7ea",
        "createdAt": "Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00)",
        "updatedAt": "Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00)",
        "category": "Social Media Marketing",
        "status": "publish",
        "scheduled": false,
        "order": 5
      }
    }
  },
  {
    "ID": "51bf2dbbed29",
    "createdAt": "2024-10-16T10:45:44.000Z",
    "updatedAt": "2024-10-25T16:45:21.855Z",
    "status": "publish",
    "title": "Popile",
    "image": "public/1729874670881_popile.svg",
    "description": "Popile is the meeting point of data and creativity in influencer marketing. We made improvements on the frontend using Vue.js, supported payment system integrations, and optimized the backend for better performance.",
    "category": "8ac7d8c79484",
    "link": "https://www.popile.com/",
    "order": 4,
    "scheduled": false,
    "_relations": {
      "category": {
        "ID": "8ac7d8c79484",
        "createdAt": "Wed Oct 16 2024 13:49:43 GMT+0300 (GMT+03:00)",
        "updatedAt": "Wed Oct 16 2024 13:49:43 GMT+0300 (GMT+03:00)",
        "category": "Support & Maintenance",
        "status": "publish",
        "scheduled": false,
        "order": 7
      }
    }
  },
  {
    "ID": "8a8044e883eb",
    "createdAt": "2024-09-26T18:08:38.000Z",
    "updatedAt": "2024-10-16T10:22:34.812Z",
    "status": "publish",
    "title": "Visivi",
    "image": "public/1729074133746_visivi.svg",
    "description": "Visivi is an HR platform with both mobile and web portals. \n\nWe developed the mobile application with React Native, making it cross-platform for both iOS and Android. For the web portal, we used Nuxt.js and Vue.js.",
    "category": "bcc834108adc",
    "link": "https://visivi.co/",
    "scheduled": false,
    "order": 5,
    "_relations": {
      "category": {
        "ID": "bcc834108adc",
        "createdAt": "Wed Oct 16 2024 11:02:51 GMT+0300 (GMT+03:00)",
        "updatedAt": "Wed Oct 16 2024 11:02:51 GMT+0300 (GMT+03:00)",
        "category": "Product Development",
        "status": "publish",
        "scheduled": false,
        "order": 9
      }
    }
  }
]
</results>

## Örnek 7: ID'si 1 Olan Tekil İş Öğesini Çekme
```typescript
sdk.query<IWorkItem>('workitems')
  .where('ID', 'eq', 'b770c71013d2')
  .include('category')
  .first();
```

<results>
{
  "ID": "1a01328952b4",
  "createdAt": "2024-10-16T10:27:21.000Z",
  "updatedAt": "2024-10-25T17:03:30.451Z",
  "status": "publish",
  "title": "Pazardan",
  "image": "public/1729875780702_pazardan.svg",
  "description": "Pazardan, yerel marketlerden sebze ve meyve siparişi vermek için bir çevrimiçi pazar yeridir.\n\nMobil uygulamayı React Native ile geliştirdik ve iOS ve Android için çapraz platform haline getirdik. Web platformu ise React.js ve Next.js ile geliştirildi.",
  "category": "cab37361e7e6",
  "link": "https://pazardan.app/",
  "order": 7,
  "scheduled": false,
  "_relations": {
    "category": {
      "ID": "cab37361e7e6",
      "createdAt": "Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00)",
      "updatedAt": "Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00)",
      "category": "Frontend Geliştirme",
      "status": "publish",
      "scheduled": false,
      "order": 1
    }
  }
}
</results>

## Örnek 8: İngilizce Süreçleri Çekme
```typescript
sdk.query<IProcessItems>('processes')
  .locale('en')
  .get();
```

<results>
[
  {
    "ID": "96c64803d441",
    "createdAt": "2024-09-26T13:59:00.000Z",
    "updatedAt": "2024-10-14T06:46:13.160Z",
    "status": "publish",
    "title": "Research & Analysis",
    "description": "We identify project goals and client needs, conducting in-depth analysis to develop the right, scalable solutions.",
    "icon": "ri-search-eye-line",
    "scheduled": false
  },
  {
    "ID": "96c64803d442",
    "createdAt": "2024-09-26T13:59:00.000Z",
    "updatedAt": "2024-10-14T07:34:08.032Z",
    "status": "publish",
    "title": "Design & Prototyping",
    "description": "We turn ideas into great designs based on each project’s goals, refining them through client feedback and iterations.",
    "icon": "ri-shape-line",
    "scheduled": false
  },
  {
    "ID": "96c64803d443",
    "createdAt": "2024-09-26T13:59:00.000Z",
    "updatedAt": "2024-10-14T07:34:08.040Z",
    "status": "publish",
    "title": "Development Stage",
    "description": "We transform designs into fully functional software, integrating key features and making sure the system is ready for testing.",
    "icon": "ri-terminal-box-line",
    "scheduled": false
  },
  {
    "ID": "96c64803d444",
    "createdAt": "2024-09-26T13:59:00.000Z",
    "updatedAt": "2024-10-18T10:17:30.139Z",
    "status": "publish",
    "title": "Testing Stage",
    "description": "We test the project to identify and resolve any issues with the client. Once approved, we deploy it to the live environment.",
    "icon": "ri-test-tube-line",
    "scheduled": false
  },
  {
    "ID": "96c64803d445",
    "createdAt": "2024-09-26T13:59:00.000Z",
    "updatedAt": "2024-10-14T07:34:08.051Z",
    "status": "publish",
    "title": "Project Deployment",
    "description": "We deploy the project to a live environment with the right structure, ensuring the product is ready for end users.",
    "icon": "ri-rocket-line",
    "scheduled": false
  },
  {
    "ID": "96c64803d446",
    "createdAt": "2024-09-26T13:59:00.000Z",
    "updatedAt": "2024-10-14T07:34:08.056Z",
    "status": "publish",
    "title": "Support & Maintenance",
    "description": "After launch, we provide continuous support and maintenance to ensure the product runs smoothly.",
    "icon": "ri-brush-3-line",
    "scheduled": false
  }
]
</results>

## Örnek 9: Türkçe Süreçleri Çekme
```typescript
sdk.query<IProcessItems>('processes')
  .locale('tr')
  .get();
```

<results>
[
  {
    "ID": "96c64803d441",
    "createdAt": "2024-09-26T13:59:00.000Z",
    "updatedAt": "2024-10-18T10:14:03.251Z",
    "status": "publish",
    "title": "Araştırma ve Analiz",
    "description": "Proje hedeflerini ve müşteri ihtiyaçlarını belirleyerek, doğru ve ölçeklenebilir çözümleri geliştirmek için analizler yapıyoruz.",
    "icon": "ri-search-eye-line",
    "scheduled": false
  },
  {
    "ID": "96c64803d442",
    "createdAt": "2024-09-26T13:59:00.000Z",
    "updatedAt": "2024-10-18T10:16:03.441Z",
    "status": "publish",
    "title": "Tasarım ve Prototipleme",
    "description": "Her projenin hedeflerine göre fikirleri uygun tasarımlara dönüştürüyor ve süreci müşteri ile birlikte iterasyonlarla ilerletiyoruz.",
    "icon": "ri-shape-line",
    "scheduled": false
  },
  {
    "ID": "96c64803d443",
    "createdAt": "2024-09-26T13:59:00.000Z",
    "updatedAt": "2024-10-18T10:18:49.403Z",
    "status": "publish",
    "title": "Yazılım Geliştirme Aşaması",
    "description": "Tasarımları tam işlevli ürünlere dönüştürüyor, temel özellikleri entegre ediyor ve sistemi test ortamına almak için hazır hale getiriyoruz.",
    "icon": "ri-terminal-box-line",
    "scheduled": false
  },
  {
    "ID": "96c64803d444",
    "createdAt": "2024-09-26T13:59:00.000Z",
    "updatedAt": "2024-10-18T10:37:26.966Z",
    "status": "publish",
    "title": "Test Aşaması",
    "description": "Olası sorunları tespit etmek için projeyi müşteriyle birlikte test ediyoruz ve ardından sorunları çözerek projeyi canlı ortama alıyoruz.",
    "icon": "ri-test-tube-line",
    "scheduled": false
  },
  {
    "ID": "96c64803d445",
    "createdAt": "2024-09-26T13:59:00.000Z",
    "updatedAt": "2024-10-18T10:00:23.252Z",
    "status": "publish",
    "title": "Proje Dağıtımı",
    "description": "Projeyi doğru yapıyla canlı ortama aktarıyoruz ve ürünün son kullanıcıya hazır olmasını sağlıyoruz.",
    "icon": "ri-rocket-line",
    "scheduled": false
  },
  {
    "ID": "96c64803d446",
    "createdAt": "2024-09-26T13:59:00.000Z",
    "updatedAt": "2024-10-18T10:09:51.488Z",
    "status": "publish",
    "title": "Destek ve Bakım",
    "description": "Projenin canlı ortama alınmasından sonra sorunsuz bir şekilde çalışmasını sağlamak için sürekli destek ve bakım sağlıyoruz.",
    "icon": "ri-brush-3-line",
    "scheduled": false
  }
]
</results>


