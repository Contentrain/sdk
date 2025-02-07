# Database Structure & Content

## Table: tbl_services

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |
| reference_id | TEXT |  |

### Data in tbl_services

| id | created_at | updated_at | status | reference_id |
| --- | --- | --- | --- | --- |
| 50d81f2a3baf | 2024-10-14T10:32:18.000Z | 2024-10-25T15:00:08.323Z | publish | 34e63b4829f0 |
| 9450777bee2f | 2024-10-14T10:33:10.000Z | 2024-10-24T10:27:13.551Z | publish | 5c5955d57da8 |
| d00761480436 | 2024-09-26T18:04:41.000Z | 2024-10-24T10:59:32.684Z | publish | 7fa159ae4aaf |
| d00761480437 | 2024-09-26T18:04:41.000Z | 2024-10-25T08:24:14.431Z | publish | NULL |
| d00761480438 | 2024-09-26T18:04:41.000Z | 2024-10-25T09:52:10.991Z | publish | NULL |
| d00761480439 | 2024-09-26T18:04:41.000Z | 2024-10-25T11:38:08.325Z | publish | NULL |
| d00761480440 | 2024-09-26T18:04:41.000Z | 2024-10-25T14:45:24.232Z | publish | NULL |

## Table: tbl_services_translations

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| locale | TEXT | ✅ |
| title | TEXT |  |
| description | TEXT |  |
| image | TEXT |  |

### Data in tbl_services_translations

| id | locale | title | description | image |
| --- | --- | --- | --- | --- |
| 50d81f2a3baf | en | Web App. Development | From concept to launch, we deliver custom web apps that are secure, scalable, and designed to meet your business needs. | public/1729868379116_Webapp.svg |
| 9450777bee2f | en | Mobile App. Development | We develop custom iOS and Android mobile apps to turn our clients' ideas into real mobile experiences. | public/1729765510539_Mobileapp.svg |
| d00761480436 | en | MVP Development | Helping startups bring their ideas to life with MVP development services. | public/1729767526420_MVP.svg |
| d00761480437 | en | SaaS Platform Development | We provide end-to-end custom SaaS platform development solutions.  | public/1729844595854_SaaS.svg |
| d00761480438 | en | Product Design | Crafting product designs that blend functionality with modern aesthetics. | public/1729849903212_ProductDesign.svg |
| d00761480439 | en | Web Design & Development | Need high convertible websites? We craft responsive websites that attract and convert visitors. | public/1729856262454_Webdesign.svg |
| d00761480440 | en | Headless CMS Solutions | We develop custom Headless CMS solutions or integrate our own Git-based Headless CMS Contentrain into your projects. | public/1729867496804_Headless.svg |
| 50d81f2a3baf | tr | Web Uygulama Geliştirme | Konseptten lansmana kadar güvenli, ölçeklenebilir ve iş ihtiyaçlarınızı karşılayacak şekilde tasarlanmış özel web uygulamaları geliştiriyoruz. | public/1729868379116_Webapp.svg |
| 9450777bee2f | tr | Mobil Uygulama Geliştirme | Müşterilerimizin fikirlerini gerçek mobil deneyimlere dönüştürebilmek için özel IOS ve Android uygulamalar geliştiriyoruz. | public/1729765510539_Mobileapp.svg |
| d00761480436 | tr | MVP Geliştirme | Startuplara, fikirlerini hayata geçirebilmeleri için deneyimli bir ekiple birlikte MVP geliştirme hizmeti sunuyoruz. | public/1729767526420_MVP.svg |
| d00761480437 | tr | SaaS Platform Geliştirme | Startuplara ve kurumsal firmalara ihtiyaç duydukları uçtan uca SaaS platform geliştirme çözümleri sağlıyoruz. | public/1729844595854_SaaS.svg |
| d00761480438 | tr | Ürün Tasarımı | İşlevselliği modern estetikle harmanlayan ürün tasarımları üretiyoruz. | public/1729849903212_ProductDesign.svg |
| d00761480439 | tr | Web Tasarımı & Geliştirme | Ziyaretçilerinizi çekecek web sitelerine mi ihtiyacınız var? İşiniz için ölçeklenebilir ve responsive web siteleri geliştiriyoruz. | public/1729856262454_Webdesign.svg |
| d00761480440 | tr | Headless CMS Çözümleri | Projeleriniz için CMS çözümleri geliştiriyor veya kendi ürünümüz olan Git tabanlı Contentrain'i projenize entegre ediyoruz. | public/1729867496804_Headless.svg |

## Table: tbl_processes

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |

### Data in tbl_processes

| id | created_at | updated_at | status |
| --- | --- | --- | --- |
| 96c64803d441 | 2024-09-26T13:59:00.000Z | 2024-10-18T10:14:03.251Z | publish |
| 96c64803d442 | 2024-09-26T13:59:00.000Z | 2024-10-18T10:16:03.441Z | publish |
| 96c64803d443 | 2024-09-26T13:59:00.000Z | 2024-10-18T10:18:49.403Z | publish |
| 96c64803d444 | 2024-09-26T13:59:00.000Z | 2024-10-18T10:37:26.966Z | publish |
| 96c64803d445 | 2024-09-26T13:59:00.000Z | 2024-10-18T10:00:23.252Z | publish |
| 96c64803d446 | 2024-09-26T13:59:00.000Z | 2024-10-18T10:09:51.488Z | publish |

## Table: tbl_processes_translations

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| locale | TEXT | ✅ |
| title | TEXT |  |
| description | TEXT |  |
| icon | TEXT |  |

### Data in tbl_processes_translations

| id | locale | title | description | icon |
| --- | --- | --- | --- | --- |
| 96c64803d441 | en | Research & Analysis | We identify project goals and client needs, conducting in-depth analysis to develop the right, scalable solutions. | ri-search-eye-line |
| 96c64803d442 | en | Design & Prototyping | We turn ideas into great designs based on each project’s goals, refining them through client feedback and iterations. | ri-shape-line |
| 96c64803d443 | en | Development Stage | We transform designs into fully functional software, integrating key features and making sure the system is ready for testing. | ri-terminal-box-line |
| 96c64803d444 | en | Testing Stage | We test the project to identify and resolve any issues with the client. Once approved, we deploy it to the live environment. | ri-test-tube-line |
| 96c64803d445 | en | Project Deployment | We deploy the project to a live environment with the right structure, ensuring the product is ready for end users. | ri-rocket-line |
| 96c64803d446 | en | Support & Maintenance | After launch, we provide continuous support and maintenance to ensure the product runs smoothly. | ri-brush-3-line |
| 96c64803d441 | tr | Araştırma ve Analiz | Proje hedeflerini ve müşteri ihtiyaçlarını belirleyerek, doğru ve ölçeklenebilir çözümleri geliştirmek için analizler yapıyoruz. | ri-search-eye-line |
| 96c64803d442 | tr | Tasarım ve Prototipleme | Her projenin hedeflerine göre fikirleri uygun tasarımlara dönüştürüyor ve süreci müşteri ile birlikte iterasyonlarla ilerletiyoruz. | ri-shape-line |
| 96c64803d443 | tr | Yazılım Geliştirme Aşaması | Tasarımları tam işlevli ürünlere dönüştürüyor, temel özellikleri entegre ediyor ve sistemi test ortamına almak için hazır hale getiriyoruz. | ri-terminal-box-line |
| 96c64803d444 | tr | Test Aşaması | Olası sorunları tespit etmek için projeyi müşteriyle birlikte test ediyoruz ve ardından sorunları çözerek projeyi canlı ortama alıyoruz. | ri-test-tube-line |
| 96c64803d445 | tr | Proje Dağıtımı | Projeyi doğru yapıyla canlı ortama aktarıyoruz ve ürünün son kullanıcıya hazır olmasını sağlıyoruz. | ri-rocket-line |
| 96c64803d446 | tr | Destek ve Bakım | Projenin canlı ortama alınmasından sonra sorunsuz bir şekilde çalışmasını sağlamak için sürekli destek ve bakım sağlıyoruz. | ri-brush-3-line |

## Table: tbl_tabitems

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |
| category_id | TEXT |  |

### Data in tbl_tabitems

| id | created_at | updated_at | status | category_id |
| --- | --- | --- | --- | --- |
| 3442ac47e4cc | Mon Oct 14 2024 12:50:29 GMT+0300 (GMT+03:00) | 2024-10-25T17:11:43.293Z | publish | cab37361e7e8 |
| 9ab7dcca9d1d | 2024-09-26T18:06:53.000Z | 2024-10-25T17:11:43.303Z | publish | cab37361e7e6 |
| 9ab7dcca9d1e | 2024-09-26T18:06:53.000Z | 2024-10-25T17:11:43.310Z | publish | cab37361e7e6 |
| 9ab7dcca9d1f | 2024-09-26T18:06:53.000Z | 2024-10-25T17:11:43.315Z | publish | cab37361e7e6 |
| 9ab7dcca9d20 | 2024-09-26T18:06:53.000Z | 2024-10-25T17:11:43.322Z | publish | cab37361e7e6 |
| 9ab7dcca9d21 | 2024-09-26T18:06:53.000Z | 2024-10-25T17:11:43.327Z | publish | cab37361e7e6 |
| 9ab7dcca9d22 | 2024-09-26T18:06:53.000Z | 2024-10-25T17:11:43.335Z | publish | cab37361e7e6 |
| 9ab7dcca9d23 | 2024-09-26T18:06:53.000Z | 2024-10-25T17:11:43.339Z | publish | cab37361e7e7 |
| 9ab7dcca9d24 | 2024-09-26T18:06:53.000Z | 2024-10-25T17:11:43.343Z | publish | cab37361e7e7 |
| 9ab7dcca9d25 | 2024-09-26T18:06:53.000Z | 2024-10-25T17:11:43.346Z | publish | cab37361e7e7 |
| 9ab7dcca9d26 | 2024-09-26T18:06:53.000Z | 2024-10-25T17:11:43.349Z | publish | cab37361e7e7 |
| 9ab7dcca9d27 | 2024-09-26T18:06:53.000Z | 2024-10-25T17:11:43.355Z | publish | cab37361e7e7 |
| 9ab7dcca9d28 | 2024-09-26T18:06:53.000Z | 2024-10-25T17:11:43.359Z | publish | cab37361e7e8 |
| 9ab7dcca9d29 | 2024-09-26T18:06:53.000Z | 2024-10-25T17:11:43.363Z | publish | cab37361e7e8 |
| bc311eb63570 | Mon Oct 14 2024 12:44:44 GMT+0300 (GMT+03:00) | 2024-10-25T17:11:43.366Z | publish | cab37361e7e8 |

## Table: tbl_tabitems_translations

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| locale | TEXT | ✅ |
| link | TEXT |  |
| description | TEXT |  |
| image | TEXT |  |

### Data in tbl_tabitems_translations

| id | locale | link | description | image |
| --- | --- | --- | --- | --- |
| 3442ac47e4cc | en | https://www.adobe.com/tr/products/photoshop.html | Adobe Photoshop is a widely used graphic design and image editing software developed by Adobe. It is primarily used for editing photos, creating digital artwork, and designing graphics for both print and web. | public/1728898765927_Photoshop.svg |
| 9ab7dcca9d1d | en | https://vuejs.org/ | Vue.js is a progressive JavaScript framework used for building user interfaces, especially single-page applications. It is designed to be incrementally adoptable and integrates well with other libraries. | public/1728541493988_vuejs.svg |
| 9ab7dcca9d1e | en | https://reactjs.dev/ | React.js is a JavaScript library for building user interfaces or UI components. It is maintained by Facebook and a large community of developers. React is known for its fast rendering and virtual DOM. | public/1728541679333_react.svg |
| 9ab7dcca9d1f | en | https://nuxtjs.com/ | Nuxt.js is a framework built on top of Vue.js that simplifies the development of server-rendered applications and static websites. It offers powerful features like SSR, static site generation, and improved SEO support. | public/1728541702569_nuxt.svg |
| 9ab7dcca9d20 | en | https://nextjs.org/ | Next.js is a React framework that enables functionality such as server-side rendering and static website generation for building high-performance, SEO-friendly applications. | public/1728541725437_next.svg |
| 9ab7dcca9d21 | en | https://astro.build/ | Astro is a new frontend framework for building fast, content-focused websites. It uses an innovative approach to page rendering called partial hydration, which makes websites faster by reducing the JavaScript sent to the browser. | public/1728541750606_astro.svg |
| 9ab7dcca9d22 | en | https://svelte.dev/ | Svelte is a modern JavaScript framework that shifts much of the work to the compile step instead of the runtime. This results in smaller bundle sizes and faster load times, making it an excellent choice for building fast web applications. | public/1728541774910_svelte.svg |
| 9ab7dcca9d23 | en | https://nodejs.org/en | Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine. It allows you to run JavaScript on the server, enabling you to build scalable and high-performance applications. | public/1728542310638_nodejs.svg |
| 9ab7dcca9d24 | en | https://expressjs.com/ | Express.js is a minimal and flexible Node.js web application framework that provides a robust set of features for building web and mobile applications. It is designed to create APIs and web servers quickly and easily. | public/1728542335115_expressjs.svg |
| 9ab7dcca9d25 | en | https://nestjs.com/ | Nest.js is a progressive Node.js framework for building efficient, reliable, and scalable server-side applications. It uses TypeScript and is heavily inspired by Angular, providing a solid architectural design for your applications. | public/1728542360382_nestjs.svg |
| 9ab7dcca9d26 | en | https://koajs.com/ | Koa.js is a modern web framework for Node.js that aims to be smaller, more expressive, and more robust. It uses async functions to eliminate callbacks and increase error-handling capabilities. | public/1728542379255_koajs.svg |
| 9ab7dcca9d27 | en | https://graphql.org/ | GraphQL is a query language for APIs and a runtime for executing those queries. It provides a more efficient and powerful alternative to REST by allowing clients to request only the data they need. | public/1728542406152_graphql.svg |
| 9ab7dcca9d28 | en | https://www.figma.com/ | Figma is the leading collaborative design tool for building meaningful products. Seamlessly design, prototype, develop, and collect feedback in a single platform. | public/1728898720249_figma.svg |
| 9ab7dcca9d29 | en | https://www.sketch.com/ | Sketch is a design software suite that helps you create beautiful products at scale, whether you’re working alone or collaboratively. | public/1728898732629_sketch.svg |
| bc311eb63570 | en | https://www.adobe.com/tr/products/illustrator.html | Adobe Illustrator is a vector-based graphic design software developed by Adobe, primarily used for creating scalable graphics such as logos, illustrations, icons, typography, and complex illustrations. | public/1728898754502_Illustrator.svg |
| 3442ac47e4cc | tr | https://www.adobe.com/tr/products/photoshop.html | Adobe Photoshop, Adobe tarafından geliştirilen ve yaygın olarak kullanılan bir grafik tasarım ve görüntü düzenleme yazılımıdır. Başlıca fotoğraf düzenleme, dijital sanat eseri oluşturma ve hem baskı hem de web için grafik tasarımı amacıyla kullanılır. | public/1728898765927_Photoshop.svg |
| 9ab7dcca9d1d | tr | https://vuejs.org/ | Vue.js Javascript tabanlı bir frameworktür. Vue.js, kullanıcı arayüzleri ve UI bileşenleri oluşturmak için kullanılan bir JavaScript kütüphanesidir. Facebook ve büyük bir geliştirici topluluğu tarafından sürdürülmektedir. Vue, hızlı renderlama ve sanal DOM ile bilinir. | public/1728541493988_vuejs.svg |
| 9ab7dcca9d1e | tr | https://reactjs.dev/ | React.js, kullanıcı arayüzleri veya UI bileşenleri oluşturmak için kullanılan bir JavaScript kütüphanesidir. Facebook ve büyük bir geliştirici topluluğu tarafından sürdürülmektedir. React, hızlı renderlama ve sanal DOM ile bilinir. | public/1728541679333_react.svg |
| 9ab7dcca9d1f | tr | https://nuxtjs.com/ | Nuxt.js, Vue.js üzerine inşa edilmiş bir frameworktür. Sunucu tarafında render edilen uygulamaların ve statik web sitelerinin geliştirilmesini kolaylaştırır. SSR, statik site oluşturma ve geliştirilmiş SEO desteği gibi güçlü özellikler sunar. | public/1728541702569_nuxt.svg |
| 9ab7dcca9d20 | tr | https://nextjs.org/ | Next.js, yüksek performanslı, SEO dostu uygulamalar oluşturmak için sunucu tarafında renderlama ve statik web sitesi oluşturma gibi işlevleri etkinleştiren bir React çerçevesidir. | public/1728541725437_next.svg |
| 9ab7dcca9d21 | tr | https://astro.build/ | Astro, hızlı, içerik odaklı web siteleri oluşturmak için yeni bir frontend çerçevesidir. Kısmi hidrasyon adı verilen sayfa renderlama yaklaşımını kullanır ve JavaScript'i tarayıcıya göndererek web sitelerini hızlandırır. | public/1728541750606_astro.svg |
| 9ab7dcca9d22 | tr | https://svelte.dev/ | Svelte, çalışma zamanı yerine derleme adımına çok işi kaydıran modern bir JavaScript çerçevesidir. Bu, daha küçük paket boyutları ve daha hızlı yükleme süreleri sağlar, bu da hızlı web uygulamaları oluşturmak için mükemmel bir seçim yapar. | public/1728541774910_svelte.svg |
| 9ab7dcca9d23 | tr | https://nodejs.org/en | Node.js, Chrome'un V8 JavaScript motoru üzerine inşa edilmiş bir JavaScript çalışma zamanıdır. Sunucuda JavaScript çalıştırmanıza olanak tanır, böylece ölçeklenebilir ve yüksek performanslı uygulamalar oluşturabilirsiniz. | public/1728542310638_nodejs.svg |
| 9ab7dcca9d24 | tr | https://expressjs.com/ | Express.js, web ve mobil uygulamalar oluşturmak için sağlam bir özellik seti sağlayan minimal ve esnek bir Node.js web uygulama çerçevesidir. API'ler ve web sunucuları hızlı ve kolay bir şekilde oluşturmak için tasarlanmıştır. | public/1728542335115_expressjs.svg |
| 9ab7dcca9d25 | tr | https://nestjs.com/ | Nest.js, verimli, güvenilir ve ölçeklenebilir sunucu taraflı uygulamalar oluşturmak için ilerici bir Node.js çerçevesidir. TypeScript kullanır ve uygulamalarınız için sağlam bir mimari tasarım sağlar, Angular'dan büyük ölçüde ilham almıştır. | public/1728542360382_nestjs.svg |
| 9ab7dcca9d26 | tr | https://koajs.com/ | Koa.js, daha küçük, daha ifade edici ve daha sağlam olmayı hedefleyen modern bir Node.js web çerçevesidir. Geri aramaları ortadan kaldırmak ve hata işleme yeteneklerini artırmak için async fonksiyonlar kullanır. | public/1728542379255_koajs.svg |
| 9ab7dcca9d27 | tr | https://graphql.org/ | GraphQL, API'ler için bir sorgu dili ve bu sorguları yürütmek için bir çalışma zamanıdır. REST'e yalnızca ihtiyaç duydukları verileri isteyerek daha verimli ve güçlü bir alternatif sunar. | public/1728542406152_graphql.svg |
| 9ab7dcca9d28 | tr | https://www.figma.com/ | Figma, anlamlı ürünler oluşturmak için önde gelen işbirlikçi tasarım aracıdır. Tek bir platformda sorunsuz bir şekilde tasarlayın, prototip oluşturun, geliştirin ve geri bildirim toplayın. | public/1728898720249_figma.svg |
| 9ab7dcca9d29 | tr | https://vuejs.org/ | Sketch, ister tek başınıza ister iş birliği yaparak, büyük ölçekte güzel ürünler oluşturmanıza yardımcı olan bir tasarım yazılım aracıdır. | public/1728898732629_sketch.svg |
| bc311eb63570 | tr | https://www.adobe.com/tr/products/illustrator.html | Adobe Illustrator, Adobe tarafından geliştirilen vektör tabanlı bir grafik tasarım yazılımıdır ve öncelikle logolar, illüstrasyonlar, ikonlar, tipografi ve karmaşık illüstrasyonlar gibi ölçeklenebilir grafikler oluşturmak için kullanılır. | public/1728898754502_Illustrator.svg |

## Table: tbl_workitems

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |
| category_id | TEXT |  |

### Data in tbl_workitems

| id | created_at | updated_at | status | category_id |
| --- | --- | --- | --- | --- |
| 1a01328952b4 | 2024-10-16T10:27:21.000Z | 2024-10-25T17:03:30.451Z | publish | cab37361e7e6 |
| 51bf2dbbed29 | 2024-10-16T10:45:44.000Z | 2024-10-25T16:45:21.859Z | publish | 8ac7d8c79484 |
| 8a8044e883e8 | 2024-09-26T18:08:38.000Z | 2024-10-25T16:49:44.612Z | publish | bcc834108adc |
| 8a8044e883e9 | 2024-09-26T18:08:38.000Z | 2024-10-25T16:38:01.211Z | publish | cab37361e7e6 |
| 8a8044e883ea | 2024-09-26T18:08:38.000Z | 2024-10-16T08:13:12.451Z | publish | 59cbdac46c1e |
| 8a8044e883eb | 2024-09-26T18:08:38.000Z | 2024-10-16T10:22:34.815Z | publish | bcc834108adc |
| 8a8044e883ec | 2024-09-26T18:08:38.000Z | 2024-10-16T10:27:04.245Z | publish | bcc834108adc |

## Table: tbl_workitems_translations

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| locale | TEXT | ✅ |
| title | TEXT |  |
| image | TEXT |  |
| description | TEXT |  |
| link | TEXT |  |
| field_order | INTEGER |  |

### Data in tbl_workitems_translations

| id | locale | title | image | description | link | field_order |
| --- | --- | --- | --- | --- | --- | --- |
| 1a01328952b4 | en | Pazardan | public/1729875780702_pazardan.svg | Pazardan is an online marketplace for ordering vegetables and fruits from local groceries. 

We developed the mobile application with React Native, making it cross-platform for iOS and Android. The web platform was developed with React.js and Next.js. | https://pazardan.app/ | 7 |
| 51bf2dbbed29 | en | Popile | public/1729874670881_popile.svg | Popile is the meeting point of data and creativity in influencer marketing. We made improvements on the frontend using Vue.js, supported payment system integrations, and optimized the backend for better performance. | https://www.popile.com/ | 4 |
| 8a8044e883e8 | en | Contentrain | public/1729065603135_denemecontentrain.svg | Contentrain is a scalable content management platform combining Git and serverless platforms.

We planned the entire project workflow, designed the software architecture, developed the frontend and backend, structured the database, and integrated all components before deployment. | https://contentrain.io/ | 1 |
| 8a8044e883e9 | en | Bloom and Fresh | public/1729874043253_Bloomandfresh.svg | Bloom & Fresh is an eCommerce platform specializing in floral arrangements and gifts.

We modernized the frontend with Vue.js and Nuxt.js, integrating it with the client's existing backend system. | https://bloomandfresh.com | 2 |
| 8a8044e883ea | en | Wordify | public/1729066309718_wordify.svg | We transformed Wordify's Squarespace-based website into a custom site using Jamstack architecture. This upgrade provided Wordify with a smooth look, enhanced performance, scalability, and improved user experience. | https://www.wordify.co/ | 3 |
| 8a8044e883eb | en | Visivi | public/1729074133746_visivi.svg | Visivi is an HR platform with both mobile and web portals. 

We developed the mobile application with React Native, making it cross-platform for both iOS and Android. For the web portal, we used Nuxt.js and Vue.js. | https://visivi.co/ | 5 |
| 8a8044e883ec | en | DXP 360 | public/1729074312031_dxp360.svg | DXP360 is an RFP (Request for Proposal) portal that aggregates RFPs from various sources, simplifying the proposal discovery and submission process for enterprises and agencies.

We designed the project plan based on client briefs, developed the frontend and backend, structured the database, and deployed the project. | https://dxp360.com/ | 6 |
| 1a01328952b4 | tr | Pazardan | public/1729875780702_pazardan.svg | Pazardan, yerel marketlerden sebze ve meyve siparişi vermek için bir çevrimiçi pazar yeridir.

Mobil uygulamayı React Native ile geliştirdik ve iOS ve Android için çapraz platform haline getirdik. Web platformu ise React.js ve Next.js ile geliştirildi. | https://pazardan.app/ | 7 |
| 51bf2dbbed29 | tr | Popile | public/1729874670881_popile.svg | Popile, influencer pazarlamasında veri ve yaratıcılığın buluşma noktasıdır. Frontend tarafında Vue.js ile iyileştirmeler yaptık, ödeme sistemi entegrasyonlarında destek sağladık ve backend tarafında performans optimizasyonları gerçekleştirdik. | https://www.popile.com/ | 4 |
| 8a8044e883e8 | tr | Contentrain | public/1729065603135_denemecontentrain.svg | Contentrain, Git ve serverless platformları birleştiren, ölçeklenebilir bir içerik yönetim platformudur.

Tüm proje iş akışını planladık, yazılım mimarisini tasarladık, frontend ve backend geliştirmelerini yaptık, veritabanını yapılandırdık ve tüm bileşenleri dağıtımdan önce entegre ettik. | https://contentrain.io/ | 1 |
| 8a8044e883e9 | tr | Bloom and Fresh | public/1729874043253_Bloomandfresh.svg | Bloom & Fresh, çiçek aranjmanları ve hediyeler konusunda uzmanlaşmış bir e-ticaret platformudur.

Frontend kısmını Vue.js ve Nuxt.js ile modernize ettik ve bunu müşterinin mevcut Backend sistemiyle entegre ettik. | https://bloomandfresh.com | 2 |
| 8a8044e883ea | tr | Wordify | public/1729066309718_wordify.svg | Wordify'ın Squarespace tabanlı web sitesini Jamstack mimarisini kullanarak özel bir siteye dönüştürdük. Bu yükseltme Wordify'a pürüzsüz bir görünüm, gelişmiş performans, ölçeklenebilirlik ve iyileştirilmiş kullanıcı deneyimi sağladı. | https://www.wordify.co/ | 3 |
| 8a8044e883eb | tr | Visivi | public/1729074133746_visivi.svg | Visivi, hem mobil hem de web portalları olan bir İK platformudur.

Mobil uygulamayı React Native ile geliştirdik ve hem iOS hem de Android için çapraz platform haline getirdik. Web portalı için Nuxt.js ve Vue.js kullandık. | https://visivi.co/ | 5 |
| 8a8044e883ec | tr | DXP 360 | public/1729074312031_dxp360.svg | DXP360, çeşitli kaynaklardan gelen RFP'leri bir araya getiren ve işletmeler ve ajanslar için teklif keşfi ve gönderim sürecini basitleştiren bir RFP (Teklif Talebi) portalıdır.

Proje planını müşteri brifinglerine göre tasarladık, ön ucu ve arka ucu geliştirdik, veritabanını yapılandırdık ve projeyi dağıttık. | https://dxp360.com/ | 6 |

## Table: tbl_workcategories

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |

### Data in tbl_workcategories

| id | created_at | updated_at | status |
| --- | --- | --- | --- |
| 59cbdac46c1e | Wed Oct 16 2024 11:08:46 GMT+0300 (GMT+03:00) | Wed Oct 16 2024 11:08:46 GMT+0300 (GMT+03:00) | publish |
| 8ac7d8c79484 | Wed Oct 16 2024 13:49:43 GMT+0300 (GMT+03:00) | Wed Oct 16 2024 13:49:43 GMT+0300 (GMT+03:00) | publish |
| b5debb48ccb2 | Wed Oct 16 2024 14:02:44 GMT+0300 (GMT+03:00) | Wed Oct 16 2024 14:02:44 GMT+0300 (GMT+03:00) | publish |
| bcc834108adc | Wed Oct 16 2024 11:02:51 GMT+0300 (GMT+03:00) | Wed Oct 16 2024 11:02:51 GMT+0300 (GMT+03:00) | publish |
| cab37361e7e6 | Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00) | Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00) | publish |
| cab37361e7e7 | Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00) | Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00) | publish |
| cab37361e7e8 | Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00) | Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00) | publish |
| cab37361e7e9 | Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00) | Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00) | publish |
| cab37361e7ea | Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00) | Thu Sep 26 2024 21:05:55 GMT+0300 (GMT+03:00) | publish |

## Table: tbl_workcategories_translations

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| locale | TEXT | ✅ |
| category | TEXT |  |
| field_order | INTEGER |  |

### Data in tbl_workcategories_translations

| id | locale | category | field_order |
| --- | --- | --- | --- |
| 59cbdac46c1e | en | Web Design & Development | 6 |
| 8ac7d8c79484 | en | Support & Maintenance | 7 |
| b5debb48ccb2 | en | Mobile App. Development | 8 |
| bcc834108adc | en | Product Development | 9 |
| cab37361e7e6 | en | Frontend Development | 1 |
| cab37361e7e7 | en | Backend Development | 2 |
| cab37361e7e8 | en | UI/UX Design | 3 |
| cab37361e7e9 | en | SEO Optimization | 4 |
| cab37361e7ea | en | Social Media Marketing | 5 |
| 59cbdac46c1e | tr | Web Tasarım ve Geliştirme | 6 |
| 8ac7d8c79484 | tr | Destek ve Bakım | 7 |
| b5debb48ccb2 | tr | Mobil Uygulama Geliştirme | 8 |
| bcc834108adc | tr | Ürün Geliştirme | 9 |
| cab37361e7e6 | tr | Frontend Geliştirme | 1 |
| cab37361e7e7 | tr | Backend Geliştirme | 2 |
| cab37361e7e8 | tr | UI/UX Tasarımı | 3 |
| cab37361e7e9 | tr | SEO Optimizasyonu | 4 |
| cab37361e7ea | tr | Sosyal Medya Pazarlama | 5 |

## Table: tbl_faqitems

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |

### Data in tbl_faqitems

| id | created_at | updated_at | status |
| --- | --- | --- | --- |
| 0c1b5726fbf6 | 2024-10-13T09:47:51.000Z | 2024-10-13T10:53:47.058Z | publish |
| 7d33292fa865 | 2024-10-13T10:16:28.000Z | 2024-10-13T11:03:34.282Z | publish |
| 951c49ca05b9 | 2024-10-10T06:20:32.000Z | 2024-10-13T10:30:59.426Z | publish |
| 9afcecd11af9 | 2024-10-13T10:04:58.000Z | 2024-10-13T11:00:53.795Z | publish |
| a528b01b5689 | 2024-09-26T13:57:30.000Z | 2024-10-13T11:13:27.768Z | publish |
| a528b01b5690 | 2024-09-26T13:57:30.000Z | 2024-10-13T10:40:27.794Z | publish |
| a528b01b5691 | 2024-09-26T13:57:30.000Z | 2024-10-13T11:17:21.433Z | publish |
| a528b01b5692 | 2024-09-26T13:57:30.000Z | 2024-10-13T10:49:35.551Z | publish |
| a528b01b5693 | 2024-09-26T13:57:30.000Z | 2024-10-13T10:52:20.345Z | publish |
| bdf371e875c4 | 2024-10-13T09:59:04.000Z | 2024-10-13T10:58:06.404Z | publish |
| c7ea2d6becc4 | 2024-10-13T10:22:27.000Z | 2024-10-13T11:05:07.806Z | publish |

## Table: tbl_faqitems_translations

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| locale | TEXT | ✅ |
| question | TEXT |  |
| answer | TEXT |  |
| field_order | INTEGER |  |

### Data in tbl_faqitems_translations

| id | locale | question | answer | field_order |
| --- | --- | --- | --- | --- |
| 0c1b5726fbf6 | en | Do you offer technical support and maintenance services after delivering the project? | Yes, we provide ongoing technical support and maintenance services to ensure your product runs smoothly. Our support includes bug fixes, updates, and feature enhancements. | 7 |
| 7d33292fa865 | en | Can you integrate 3rd party app services into my existing project? | Our team is skilled in integrating 3rd party solutions with existing systems. Whether it’s APIs or 3rd platforms we provide seamless integrations to enhance your digital ecosystem. | 10 |
| 951c49ca05b9 | en | What does Lanista Software specialize in? | At Lanista Software, we develop custom web and mobile apps for different businesses. With expertise in end-to-end product development, we also help startups to create solid MVPs. | 1 |
| 9afcecd11af9 | en | Can you help with app ideas and structure? | Absolutely. We collaborate closely with clients to refine ideas and develop app structure, providing insights into user experience, functionality, and technical feasibility. | 9 |
| a528b01b5689 | en | What industries does Lanista Software serve? | We develop high-performance software solutions for industries like saas, e-commerce, healthcare, finance, education, retail, media, manufacturing, automotive and HR services.  | 2 |
| a528b01b5690 | en | How does the software product development process work? | We begin by understanding your goals, then research, plan and create a prototype. After approval, we proceed with development, testing and deployment, keeping you involved throughout. | 3 |
| a528b01b5691 | en | How long does it take to develop a software product? | Geliştirme zaman çizelgesi projenin karmaşıklığına ve kapsamına bağlıdır. Hedeflerinizi analiz ettikten sonra, projeye başlamadan önce size ayrıntılı bir zaman çizelgesi sunuyoruz. | 4 |
| a528b01b5692 | en | What if I want to make changes to the project after development starts? | We understand that new ideas can emerge during development. Our agile approach allows flexibility for changes, and we assess the impact on timelines and budget before moving forward. | 5 |
| a528b01b5693 | en | How often will I receive updates about my project from the team? | We believe in transparent communication throughout the development process. You can get regular updates through weekly meetings, progress reports, and demos at key milestones. | 6 |
| bdf371e875c4 | en | What is your pricing model? | We offer flexible pricing based on your project needs, including fixed-price contracts for well-defined projects or hourly rates for more dynamic ones. | 8 |
| c7ea2d6becc4 | en | Why do I need custom software? | Custom software meets your business’s unique requirements. It offers flexibility, scalability, and seamless integration with existing processes, providing better user experience. | 11 |
| 0c1b5726fbf6 | tr | Proje tesliminden sonra teknik destek ve bakım hizmeti sunuyor musunuz? | Evet, ürününüzün sorunsuz çalışmasını sağlamak için teknik destek ve bakım hizmetleri sağlıyoruz. Desteğimiz hata düzeltmeleri, güncellemeler ve özellik geliştirmelerini içeriyor. | 7 |
| 7d33292fa865 | tr | Mevcut projeme 3. parti uygulamaları entegre edebilir misiniz? | Ekibimiz, 3. parti çözümleri mevcut sistemlerle entegre etme konusunda uzmandır. API'leri ve 3. parti çözümleri dijital ekosisteminizi geliştirmek için projenize entegre ediyoruz. | 10 |
| 951c49ca05b9 | tr | Lanista Yazılım'ın uzmanlık alanları nelerdir? | Lanista Yazılım olarak, farklı işletmeler için web ve mobil uygulamalar geliştiriyoruz. Uçtan uca ürün geliştirme konusundaki uzmanlığımızla, startuplar için MVP’ler geliştiriyoruz. | 1 |
| 9afcecd11af9 | tr | Uygulama fikirleri ve yapısı konusunda yardımcı oluyor musunuz? | Fikir ve uygulama yapısını geliştirmek için müşterilerimizle yakın bir şekilde iş birliği yapıyor, kullanıcı deneyimi, işlevsellik ve teknik uygulanabilirlik konusunda destek sağlıyoruz. | 9 |
| a528b01b5689 | tr | Lanista Yazılım hangi sektörlere hizmet veriyor? | SaaS, e-ticaret, sağlık, finans, eğitim, perakende, medya, üretim, otomotiv ve insan kaynakları gibi sektörler için yüksek performanslı yazılım çözümleri sunuyoruz. | 2 |
| a528b01b5690 | tr | Yazılım ürünü geliştirme süreci nasıl işliyor? | Hedeflerinizi anlayarak başlıyoruz, ardından araştırma, planlama ve prototip oluşturma aşamalarına geçiyoruz. Prototip onayı sonrasında ürün geliştirme sürecine başlıyoruz. Ürünün test süreçlerine sizi de dahil ederek, ürünün sorunsuz versiyonunu yayına alıyoruz. | 3 |
| a528b01b5691 | tr | Bir yazılım ürününü geliştirmek ne kadar zaman alır? | Contentrain'de bir kampanya oluşturmak için bir marka olarak kaydolmanız gerekmektedir. Kaydolduktan sonra kampanyanızı oluşturabilir ve içerik oluşturuculardan başvurular almaya başlayabilirsiniz. | 4 |
| a528b01b5692 | tr | Geliştirme başladıktan sonra projede değişiklik yapmak istersem ne olur? | Ürün geliştirme sırasında yeni fikirler ortaya çıkabilir ve projenin ek geliştirmelere ihtiyacı olabilir. Komponent bazlı proje geliştirme yöntemimiz, değişiklikler için esneklik sağlar. | 5 |
| a528b01b5693 | tr | Projem hakkında ekipten ne sıklıkla güncelleme alacağım? | Geliştirme süreci boyunca şeffaf iletişime inanıyoruz. Haftalık toplantılar ve önemli kilometre taşlarında demolar görerek projeniz hakkında düzenli güncellemeler alabilirsiniz. | 6 |
| bdf371e875c4 | tr | Fiyatlandırma modeliniz nedir? | Projenizin ihtiyaçlarına göre esnek fiyatlandırma sunuyoruz; kapsam detayları belirli projelerde sabit fiyat, daha dinamik projelerde ise saatlik fiyatlandırma seçenekleri sunuyoruz. | 8 |
| c7ea2d6becc4 | tr | Neden özel bir yazılım geliştirme çözümüne ihtiyacım var? | Özel yazılımlar, işletmenizin benzersiz ihtiyaçlarını karşılar. Esneklik, ölçeklenebilirlik ve mevcut süreçlerle kusursuz entegrasyon sunarak daha iyi kullanıcı deneyimi sağlar. | 11 |

## Table: tbl_sections

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |

### Data in tbl_sections

| id | created_at | updated_at | status |
| --- | --- | --- | --- |
| 2aa54f9e7eaf | 2024-09-26T18:05:14.000Z | 2024-10-23T08:30:32.237Z | publish |
| 2aa54f9e7eb0 | 2024-09-26T18:05:14.000Z | 2024-10-18T09:36:05.191Z | changed |
| 2aa54f9e7eb1 | 2024-09-26T18:05:14.000Z | 2024-10-18T09:43:20.869Z | publish |
| 2aa54f9e7eb2 | 2024-09-26T18:05:14.000Z | 2024-10-18T09:40:26.946Z | changed |
| 2aa54f9e7eb3 | 2024-09-26T18:05:14.000Z | 2024-10-18T09:38:31.523Z | changed |
| 2aa54f9e7x90 | 2024-09-26T18:05:14.000Z | 2024-10-18T06:11:51.339Z | publish |
| 2aa54f9e7xb3 | 2024-09-26T18:05:14.000Z | 2024-10-18T09:47:18.809Z | publish |
| 2aa54f9e7xb4 | 2024-09-26T18:05:14.000Z | 2024-10-18T08:43:34.347Z | changed |
| 2aa54f9e7xb5 | 2024-09-26T18:05:14.000Z | 2024-10-18T08:44:52.950Z | publish |

## Table: tbl_sections_translations

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| locale | TEXT | ✅ |
| title | TEXT |  |
| description | TEXT |  |
| buttontext | TEXT |  |
| buttonlink | TEXT |  |
| name | TEXT |  |
| subtitle | TEXT |  |

### Data in tbl_sections_translations

| id | locale | title | description | buttontext | buttonlink | name | subtitle |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2aa54f9e7eaf | en | Explore our expertise in outsourced Development Services | We offer a wide range of software development services, guiding our clients through every step from concept to final product. | See our latest works | #works | services | NULL |
| 2aa54f9e7eb0 | en | Building Success: Our product development approach | We follow a structured approach to ensure each project is delivered on time, with secure architecture, and within budget. | View all works | #works | process | NULL |
| 2aa54f9e7eb1 | en | Trusted by Industry Professionals | Our focus on quality has earned the trust of industry professionals over time. We deliver tailored solutions that meet the highest standards for our clients.
 | View all testimonials | #testimonials | testimonials | NULL |
| 2aa54f9e7eb2 | en | Our recent client works | Explore some of our recent projects where we’ve partnered with clients to turn their ideas into successful products. | View all works | #works | works | NULL |
| 2aa54f9e7eb3 | en | Our technology and tool stack | We love to use Javascript frameworks and the latest technologies to deliver great products. | View all testimonials | #testimonials | tabs | NULL |
| 2aa54f9e7x90 | en | Let's build together! | We help companies and startups bring their ideas to life with our experience. | Contact us | #contact | banner | NULL |
| 2aa54f9e7xb3 | en | Web & Mobile Application development services | We provide outsourced Frontend, Backend, and Mobile Application development services to craft custom digital projects that drive results.
 | Let's discuss your project | #contact | hero | Software Development Company |
| 2aa54f9e7xb4 | en | FAQ's | Find quick answers to common questions about Lanista’s services. Need more help? Contact our team anytime. | Let's discuss your project | #contact | faq | NULL |
| 2aa54f9e7xb5 | en | Reach out for more information | Can’t find what you’re looking for in the FAQs? Feel free to reach out to us directly for more information. | Send | #testimonials | contact | NULL |
| 2aa54f9e7eaf | tr | Yazılım geliştirme çözümlerimize göz atın | Müşterilerimize, tasarımdan final ürüne kadar her adımda rehberlik ederek geniş kapsamlı yazılım geliştirme hizmetleri sunuyoruz. | Son projelerimizi inceleyin | #works | services | NULL |
| 2aa54f9e7eb0 | tr | Ürün geliştirme ve proje yönetme yaklaşımımız | Projenizin zamanında ve bütçe dahilinde teslim edilmesini sağlamak için sistemli bir proje geliştirme süreci izliyoruz. | Tüm çalışmaları görüntüleyin | #works | process | NULL |
| 2aa54f9e7eb1 | tr | Sektör profesyonelleri tarafından güvenilen bir yazılım geliştirme partneriyiz | Kaliteye odaklanarak çalışmamız zamanla sektör profesyonellerinin güvenini kazandı. Müşterilerimiz için en yüksek standartları karşılayan özel çözümler sunuyoruz. | Tüm referanslar | #testimonials | testimonials | NULL |
| 2aa54f9e7eb2 | tr | Müşterilerimiz için geliştirdiğimiz bazı projeler | Müşterilerimizin fikirlerini geliştirerek başarılı ürünlere dönüştürdüğümüz projelerimizden bazılarını inceleyin. | Tüm çalışmaları görüntüleyin | #works | works | NULL |
| 2aa54f9e7eb3 | tr | Kullandığımız teknolojiler ve geliştirme araçları  | Harika ürünler ortaya çıkarmak için Javascript teknolojilerini ve güncel araçları kullanmayı seviyoruz. | Tüm referanslar | #testimonials | tabs | NULL |
| 2aa54f9e7x90 | tr | Fikrinizi birlikte geliştirelim! | Ürün geliştirme tecrübemizle şirketlerin ve girişimlerin fikirlerini hayata geçirmelerine yardımcı oluyoruz. | Projenizi konuşalım | #contact | banner | NULL |
| 2aa54f9e7xb3 | tr | Web ve Mobil Uygulama geliştirme hizmetleri partneriniz | Dijital dünyada başarılı iş modelleri geliştirebilmeniz için dış kaynaklı Frontend, Backend ve Mobil Uygulama geliştirme hizmetleri sunuyoruz. | Projenizi konuşalım | #contact | hero | Yazılım Geliştirme Şirketi |
| 2aa54f9e7xb4 | tr | Sıkça Sorulan Sorular | Lanista Yazılım'ın hizmetleri hakkında sık sorulan sorularla hızlı yanıtlar bulun. Eğer daha fazla yanıta ihtiyaç duyuyorsanız bizimle iletişime geçebilirsiniz. | Projenizi konuşalım | #contact | faq | NULL |
| 2aa54f9e7xb5 | tr | Daha fazla bilgi için bize ulaşın | Daha fazla bilgi için bizimle doğrudan iletişime geçmekten çekinmeyin. | Gönder | #testimonials | contact | NULL |

## Table: tbl_sociallinks

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |
| link | TEXT |  |
| icon | TEXT |  |
| service_id | TEXT |  |

### Data in tbl_sociallinks

| id | created_at | updated_at | status | link | icon | service_id |
| --- | --- | --- | --- | --- | --- | --- |
| 2aa54f9e7eaf | 2024-09-26T18:05:14.000Z | 2024-10-22T10:40:07.059Z | publish | https://www.linkedin.com/company/lanista-software | ri-linkedin-line | 50d81f2a3baf |
| 2aa54f9e7eb1 | 2024-09-26T18:05:14.000Z | 2024-10-22T09:35:21.910Z | publish | https://x.com/lanistasoftware | ri-twitter-line | 9450777bee2f |
| 2aa54f9e7eb2 | 2024-09-26T18:05:14.000Z | 2024-10-22T10:40:07.066Z | publish | https://www.instagram.com/lanistasoftware/ | ri-instagram-line | d00761480436 |

## Table: tbl_references

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |
| logo | TEXT |  |

### Data in tbl_references

| id | created_at | updated_at | status | logo |
| --- | --- | --- | --- | --- |
| 34e63b4829f0 | 2024-09-27T19:58:20.000Z | 2024-10-08T13:42:57.061Z | publish | public/1728394907608_Popile.svg |
| 5c5955d57da8 | 2024-09-27T19:58:54.000Z | 2024-10-09T15:05:43.629Z | publish | public/1728394892554_pazardan.svg |
| 7fa159ae4aaf | 2024-09-27T19:58:40.000Z | 2024-10-08T13:42:57.072Z | publish | public/1728394876736_Contentrain.svg |
| ae0d98f178d1 | 2024-09-27T19:59:08.000Z | 2024-10-08T13:42:57.076Z | publish | public/1728394832510_Visivi.svg |
| ca7bedf86bfb | 2024-09-27T19:59:01.000Z | 2024-10-09T07:27:46.424Z | publish | public/1728458840475_Bloomandfresh.svg |

## Table: tbl_meta_tags

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |

### Data in tbl_meta_tags

| id | created_at | updated_at | status |
| --- | --- | --- | --- |
| 02135e680b44 | Mon Apr 29 2024 14:35:46 GMT+0300 (GMT+03:00) | 2024-04-29T11:37:31.204Z | publish |
| 196caf507337 | 2024-04-29T11:37:02.000Z | 2024-10-18T09:02:07.738Z | changed |
| 4a02e38c9389 | 2024-05-16T11:32:09.000Z | 2024-10-18T09:02:34.526Z | changed |
| 66a7106a5d6a | Mon Apr 29 2024 14:39:20 GMT+0300 (GMT+03:00) | 2024-04-29T11:39:52.021Z | publish |
| 6dcd400f4763 | 2024-04-29T11:38:59.000Z | 2024-10-18T09:01:09.158Z | changed |
| 6ea95fa81d7f | Mon Apr 29 2024 14:38:15 GMT+0300 (GMT+03:00) | 2024-04-29T11:39:52.053Z | publish |
| 9f3fb78abf01 | 2024-04-29T11:38:01.000Z | 2024-10-18T09:26:50.708Z | changed |
| a756a05f093e | 2024-08-16T11:38:53.000Z | 2024-10-18T09:27:42.792Z | changed |
| ba01e958b444 | 2024-04-25T09:37:26.000Z | 2024-10-18T09:00:34.866Z | changed |
| ce993b69b8ff | 2024-04-29T11:38:28.000Z | 2024-10-18T09:06:05.245Z | changed |
| dc2539d45a50 | 2024-04-29T11:36:05.000Z | 2024-10-18T09:18:48.377Z | publish |
| de2b9bd58b75 | 2024-04-29T11:36:39.000Z | 2024-10-18T09:06:47.362Z | changed |
| 38eb812efbfe | Fri Oct 18 2024 10:31:40 GMT+0300 (GMT+03:00) | Fri Oct 18 2024 10:31:40 GMT+0300 (GMT+03:00) | draft |

## Table: tbl_meta_tags_translations

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| locale | TEXT | ✅ |
| name | TEXT |  |
| content | TEXT |  |
| description | TEXT |  |

### Data in tbl_meta_tags_translations

| id | locale | name | content | description |
| --- | --- | --- | --- | --- |
| 02135e680b44 | en | ogType | website | default |
| 196caf507337 | en | ogTitle | Lanista | Web and Mobile App. development partner | defalt |
| 4a02e38c9389 | en | twitter:title | Lanista | Web and Mobile App. development partner | Lanista twitter ogtitle |
| 66a7106a5d6a | en | twitterSiteId | twitter-site-id | default |
| 6dcd400f4763 | en | twitterDescription | We provide end-to-end outsourced web and mobile application development services to drive your business's growth in today's digital world. | default |
| 6ea95fa81d7f | en | twitterCard | summary | default |
| 9f3fb78abf01 | en | ogSiteName | Lanista | Web and Mobile App. development partner | default |
| a756a05f093e | en | title | Lanista | Web and Mobile App. development partner | Lanista website ogtitle |
| ba01e958b444 | en | description | We provide end-to-end outsourced web and mobile application development services to drive your business's growth in today's digital world. | website ogdescription |
| ce993b69b8ff | en | twitterTitle | Lanista | Web and Mobile App. development partner | default |
| dc2539d45a50 | en | ogImage | https://res.cloudinary.com/dmywgn45o/image/upload/v1729243091/lanista_og_chgpop.jpg | default |
| de2b9bd58b75 | en | ogDescription | We provide end-to-end outsourced web and mobile application development services to drive your business's growth in today's digital world. | default |
| 02135e680b44 | tr | ogType | website | default |
| 196caf507337 | tr | ogTitle | Lanista | Web ve Mobile uygulama geliştirme partneriniz | defalt |
| 38eb812efbfe | tr | ogImage | url gelecek | website ogimage |
| 4a02e38c9389 | tr | twitter:title | Lanista | Web ve Mobile uygulama geliştirme partneriniz | Lanista twitter ogtitle |
| 66a7106a5d6a | tr | twitterSiteId | twitter-site-id | default |
| 6dcd400f4763 | tr | twitterDescription | İşletmenizin günümüz dijital dünyasında büyümesini sağlamak için uçtan uca dış kaynaklı web ve mobil uygulama geliştirme hizmetleri sağlıyoruz. | default |
| 6ea95fa81d7f | tr | twitterCard | summary | default |
| 9f3fb78abf01 | tr | ogSiteName | Lanista | Web ve Mobile uygulama geliştirme partneriniz | default |
| a756a05f093e | tr | title | Lanista | Web ve Mobile uygulama geliştirme partneriniz | Lanista website ogtitle |
| ba01e958b444 | tr | description | İşletmenizin günümüz dijital dünyasında büyümesini sağlamak için uçtan uca dış kaynaklı web ve mobil uygulama geliştirme hizmetleri sağlıyoruz. | website ogdescription |
| ce993b69b8ff | tr | twitterTitle | Lanista | Web ve Mobile uygulama geliştirme partneriniz | default |
| dc2539d45a50 | tr | ogImage | https://res.cloudinary.com/dmywgn45o/image/upload/v1729243091/lanista_og_chgpop.jpg | default |
| de2b9bd58b75 | tr | ogDescription | İşletmenizin günümüz dijital dünyasında büyümesini sağlamak için uçtan uca dış kaynaklı web ve mobil uygulama geliştirme hizmetleri sağlıyoruz. | default |

## Table: tbl_testimonial_items

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| created_at | TEXT |  |
| updated_at | TEXT |  |
| status | TEXT |  |
| creative_work_id | TEXT |  |

### Data in tbl_testimonial_items

| id | created_at | updated_at | status | creative_work_id |
| --- | --- | --- | --- | --- |
| 89ae53eb8370 | 2024-10-13T11:24:25.000Z | 2024-10-16T11:10:08.070Z | publish | 51bf2dbbed29 |
| b770c71013d2 | 2024-10-16T11:26:26.000Z | 2024-10-17T11:37:05.705Z | publish | 8a8044e883e9 |
| c421eb634cfa | Wed Oct 16 2024 14:31:21 GMT+0300 (GMT+03:00) | Wed Oct 16 2024 14:31:21 GMT+0300 (GMT+03:00) | publish | 8a8044e883eb |

## Table: tbl_testimonial_items_translations

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| locale | TEXT | ✅ |
| name | TEXT |  |
| description | TEXT |  |
| title | TEXT |  |
| image | TEXT |  |

### Data in tbl_testimonial_items_translations

| id | locale | name | description | title | image |
| --- | --- | --- | --- | --- | --- |
| 89ae53eb8370 | en | Ertuğrul Uçar | Lanista Software supported Popile’s frontend and backend in its early stages, helping us improve our work. | CEO, Popile | public/1728463995414_ertugrul.jpeg |
| b770c71013d2 | en | Murat Sus | The team has a great ability to resolve any problem by adapting innovative technologies and approaches. | Co-Founder, Bloom and Fresh | public/1729164933955_murat.png |
| c421eb634cfa | en | Ege Büyüktaşkın | Lanista Software worked closely with my team to bring my idea to life, making the whole process smooth. | Founder, Visivi | public/1728464446315_ege.jpeg |
| 89ae53eb8370 | tr | Ertuğrul Uçar | Lanista Software, Popile’nin ilk aşamalarında bize Frontend ve Backend tarafında destek oldu, bu da işimizi daha iyi hale getirmemizi sağladı. | CEO, Popile | public/1728463995414_ertugrul.jpeg |
| b770c71013d2 | tr | Murat Sus | Lanista ekibi, yenilikçi teknoloji ve yaklaşımları benimseyerek her türlü sorunu çözme konusunda büyük bir yeteneğe sahip. | Co-Founder, Bloom and Fresh | public/1729164933955_murat.png |
| c421eb634cfa | tr | Ege Büyüktaşkın | Lanista Yazılım, ekibimle yakın iş birliği içinde çalışarak fikrimi hayata geçirdi ve süreci çok daha kolay hale getirdi. | Kurucu, Visiv | public/1728464446315_ege.jpeg |

## Table: tbl_contentrain_relations

| Column | Type | Primary Key |
|--------|------|------------|
| id | TEXT | ✅ |
| source_model | TEXT |  |
| source_id | TEXT |  |
| target_model | TEXT |  |
| target_id | TEXT |  |
| field_id | TEXT |  |
| type | TEXT |  |

### Data in tbl_contentrain_relations

| id | source_model | source_id | target_model | target_id | field_id | type |
| --- | --- | --- | --- | --- | --- | --- |
| 1a01328952b4_category_cab37361e7e6 | workitems | 1a01328952b4 | workcategories | cab37361e7e6 | category | one-to-one |
| 51bf2dbbed29_category_8ac7d8c79484 | workitems | 51bf2dbbed29 | workcategories | 8ac7d8c79484 | category | one-to-one |
| 8a8044e883e8_category_bcc834108adc | workitems | 8a8044e883e8 | workcategories | bcc834108adc | category | one-to-one |
| 8a8044e883e9_category_cab37361e7e6 | workitems | 8a8044e883e9 | workcategories | cab37361e7e6 | category | one-to-one |
| 8a8044e883ea_category_59cbdac46c1e | workitems | 8a8044e883ea | workcategories | 59cbdac46c1e | category | one-to-one |
| 8a8044e883eb_category_bcc834108adc | workitems | 8a8044e883eb | workcategories | bcc834108adc | category | one-to-one |
| 8a8044e883ec_category_bcc834108adc | workitems | 8a8044e883ec | workcategories | bcc834108adc | category | one-to-one |
| 89ae53eb8370_creative-work_51bf2dbbed29 | testimonial-items | 89ae53eb8370 | workitems | 51bf2dbbed29 | creative-work | one-to-one |
| b770c71013d2_creative-work_8a8044e883e9 | testimonial-items | b770c71013d2 | workitems | 8a8044e883e9 | creative-work | one-to-one |
| c421eb634cfa_creative-work_8a8044e883eb | testimonial-items | c421eb634cfa | workitems | 8a8044e883eb | creative-work | one-to-one |
| 50d81f2a3baf_reference_34e63b4829f0 | services | 50d81f2a3baf | references | 34e63b4829f0 | reference | one-to-one |
| 9450777bee2f_reference_5c5955d57da8 | services | 9450777bee2f | references | 5c5955d57da8 | reference | one-to-one |
| d00761480436_reference_7fa159ae4aaf | services | d00761480436 | references | 7fa159ae4aaf | reference | one-to-one |
| 2aa54f9e7eaf_service_50d81f2a3baf | sociallinks | 2aa54f9e7eaf | services | 50d81f2a3baf | service | one-to-one |
| 2aa54f9e7eb1_service_9450777bee2f | sociallinks | 2aa54f9e7eb1 | services | 9450777bee2f | service | one-to-one |
| 2aa54f9e7eb2_service_d00761480436 | sociallinks | 2aa54f9e7eb2 | services | d00761480436 | service | one-to-one |
| 3442ac47e4cc_category_cab37361e7e8 | tabitems | 3442ac47e4cc | workcategories | cab37361e7e8 | category | one-to-many |
| 9ab7dcca9d1d_category_cab37361e7e6 | tabitems | 9ab7dcca9d1d | workcategories | cab37361e7e6 | category | one-to-many |
| 9ab7dcca9d1d_category_cab37361e7e8 | tabitems | 9ab7dcca9d1d | workcategories | cab37361e7e8 | category | one-to-many |
| 9ab7dcca9d1e_category_cab37361e7e6 | tabitems | 9ab7dcca9d1e | workcategories | cab37361e7e6 | category | one-to-many |
| 9ab7dcca9d1e_category_cab37361e7e8 | tabitems | 9ab7dcca9d1e | workcategories | cab37361e7e8 | category | one-to-many |
| 9ab7dcca9d1f_category_cab37361e7e6 | tabitems | 9ab7dcca9d1f | workcategories | cab37361e7e6 | category | one-to-many |
| 9ab7dcca9d1f_category_cab37361e7e8 | tabitems | 9ab7dcca9d1f | workcategories | cab37361e7e8 | category | one-to-many |
| 9ab7dcca9d20_category_cab37361e7e6 | tabitems | 9ab7dcca9d20 | workcategories | cab37361e7e6 | category | one-to-many |
| 9ab7dcca9d20_category_cab37361e7e8 | tabitems | 9ab7dcca9d20 | workcategories | cab37361e7e8 | category | one-to-many |
| 9ab7dcca9d21_category_cab37361e7e6 | tabitems | 9ab7dcca9d21 | workcategories | cab37361e7e6 | category | one-to-many |
| 9ab7dcca9d21_category_cab37361e7e8 | tabitems | 9ab7dcca9d21 | workcategories | cab37361e7e8 | category | one-to-many |
| 9ab7dcca9d22_category_cab37361e7e6 | tabitems | 9ab7dcca9d22 | workcategories | cab37361e7e6 | category | one-to-many |
| 9ab7dcca9d22_category_cab37361e7e8 | tabitems | 9ab7dcca9d22 | workcategories | cab37361e7e8 | category | one-to-many |
| 9ab7dcca9d23_category_cab37361e7e7 | tabitems | 9ab7dcca9d23 | workcategories | cab37361e7e7 | category | one-to-many |
| 9ab7dcca9d23_category_cab37361e7e8 | tabitems | 9ab7dcca9d23 | workcategories | cab37361e7e8 | category | one-to-many |
| 9ab7dcca9d24_category_cab37361e7e7 | tabitems | 9ab7dcca9d24 | workcategories | cab37361e7e7 | category | one-to-many |
| 9ab7dcca9d24_category_cab37361e7e8 | tabitems | 9ab7dcca9d24 | workcategories | cab37361e7e8 | category | one-to-many |
| 9ab7dcca9d25_category_cab37361e7e7 | tabitems | 9ab7dcca9d25 | workcategories | cab37361e7e7 | category | one-to-many |
| 9ab7dcca9d25_category_cab37361e7e8 | tabitems | 9ab7dcca9d25 | workcategories | cab37361e7e8 | category | one-to-many |
| 9ab7dcca9d26_category_cab37361e7e7 | tabitems | 9ab7dcca9d26 | workcategories | cab37361e7e7 | category | one-to-many |
| 9ab7dcca9d26_category_cab37361e7e8 | tabitems | 9ab7dcca9d26 | workcategories | cab37361e7e8 | category | one-to-many |
| 9ab7dcca9d27_category_cab37361e7e7 | tabitems | 9ab7dcca9d27 | workcategories | cab37361e7e7 | category | one-to-many |
| 9ab7dcca9d27_category_cab37361e7e8 | tabitems | 9ab7dcca9d27 | workcategories | cab37361e7e8 | category | one-to-many |
| 9ab7dcca9d28_category_cab37361e7e8 | tabitems | 9ab7dcca9d28 | workcategories | cab37361e7e8 | category | one-to-many |
| 9ab7dcca9d29_category_cab37361e7e8 | tabitems | 9ab7dcca9d29 | workcategories | cab37361e7e8 | category | one-to-many |
| bc311eb63570_category_cab37361e7e8 | tabitems | bc311eb63570 | workcategories | cab37361e7e8 | category | one-to-many |

