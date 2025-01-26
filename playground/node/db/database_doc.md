# Veritabanı Yapısı ve İçeriği

## Tablo: faqitems

### Şema

```sql
CREATE TABLE faqitems (ID TEXT PRIMARY KEY, question TEXT NOT NULL, answer TEXT NOT NULL, order_field INTEGER NOT NULL, status INTEGER NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, scheduled INTEGER NOT NULL DEFAULT 0, scheduled_at DATETIME)
```

### Varsayılan İçerik (İngilizce)

| ID | question | answer | order_field | status | created_at | updated_at | scheduled | scheduled_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0c1b5726fbf6 | Do you offer technical support and maintenance services after delivering the project? | Yes, we provide ongoing technical support and maintenance services to ensure your product runs smoothly. Our support includes bug fixes, updates, and feature enhancements. | 7 | publish | 2024-10-13T09:47:51.000Z | 2024-10-13T10:53:47.055Z |  |  |
| 7d33292fa865 | Can you integrate 3rd party app services into my existing project? | Our team is skilled in integrating 3rd party solutions with existing systems. Whether it’s APIs or 3rd platforms we provide seamless integrations to enhance your digital ecosystem. | 10 | publish | 2024-10-13T10:16:28.000Z | 2024-10-13T11:03:34.276Z |  |  |
| 951c49ca05b9 | What does Lanista Software specialize in? | At Lanista Software, we develop custom web and mobile apps for different businesses. With expertise in end-to-end product development, we also help startups to create solid MVPs. | 1 | publish | 2024-10-10T06:20:32.000Z | 2024-10-13T09:27:06.080Z |  |  |
| 9afcecd11af9 | Can you help with app ideas and structure? | Absolutely. We collaborate closely with clients to refine ideas and develop app structure, providing insights into user experience, functionality, and technical feasibility. | 9 | publish | 2024-10-13T10:04:58.000Z | 2024-10-13T10:04:58.000Z |  |  |
| a528b01b5689 | What industries does Lanista Software serve? | We develop high-performance software solutions for industries like saas, e-commerce, healthcare, finance, education, retail, media, manufacturing, automotive and HR services.  | 2 | publish | 2024-09-26T13:57:30.000Z | 2024-10-13T11:15:52.865Z |  |  |

### Lokalize İçerik (Türkçe)

| lang | ID | created_at | updated_at | question | answer | order_field |
| --- | --- | --- | --- | --- | --- | --- |
| tr | 0c1b5726fbf6 | 2024-10-13T09:47:51.000Z | 2024-10-13T10:53:47.058Z | Proje tesliminden sonra teknik destek ve bakım hizmeti sunuyor musunuz? | Evet, ürününüzün sorunsuz çalışmasını sağlamak için teknik destek ve bakım hizmetleri sağlıyoruz. Desteğimiz hata düzeltmeleri, güncellemeler ve özellik geliştirmelerini içeriyor. | 7 |
| tr | 7d33292fa865 | 2024-10-13T10:16:28.000Z | 2024-10-13T11:03:34.282Z | Mevcut projeme 3. parti uygulamaları entegre edebilir misiniz? | Ekibimiz, 3. parti çözümleri mevcut sistemlerle entegre etme konusunda uzmandır. API'leri ve 3. parti çözümleri dijital ekosisteminizi geliştirmek için projenize entegre ediyoruz. | 10 |
| tr | 951c49ca05b9 | 2024-10-10T06:20:32.000Z | 2024-10-13T10:30:59.426Z | Lanista Yazılım'ın uzmanlık alanları nelerdir? | Lanista Yazılım olarak, farklı işletmeler için web ve mobil uygulamalar geliştiriyoruz. Uçtan uca ürün geliştirme konusundaki uzmanlığımızla, startuplar için MVP’ler geliştiriyoruz. | 1 |
| tr | 9afcecd11af9 | 2024-10-13T10:04:58.000Z | 2024-10-13T11:00:53.795Z | Uygulama fikirleri ve yapısı konusunda yardımcı oluyor musunuz? | Fikir ve uygulama yapısını geliştirmek için müşterilerimizle yakın bir şekilde iş birliği yapıyor, kullanıcı deneyimi, işlevsellik ve teknik uygulanabilirlik konusunda destek sağlıyoruz. | 9 |
| tr | a528b01b5689 | 2024-09-26T13:57:30.000Z | 2024-10-13T11:13:27.768Z | Lanista Yazılım hangi sektörlere hizmet veriyor? | SaaS, e-ticaret, sağlık, finans, eğitim, perakende, medya, üretim, otomotiv ve insan kaynakları gibi sektörler için yüksek performanslı yazılım çözümleri sunuyoruz. | 2 |

## Tablo: meta_tags

### Şema

```sql
CREATE TABLE meta_tags (ID TEXT PRIMARY KEY, name TEXT NOT NULL, content TEXT NOT NULL, description TEXT , status INTEGER NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, scheduled INTEGER NOT NULL DEFAULT 0, scheduled_at DATETIME)
```

### Varsayılan İçerik (İngilizce)

| ID | name | content | description | status | created_at | updated_at | scheduled | scheduled_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 02135e680b44 | ogType | website | default | publish | 2024-04-29T11:35:46.000Z | 2024-10-18T09:28:17.255Z |  |  |
| 196caf507337 | ogTitle | Lanista | Web and Mobile App. development partner | defalt | publish | 2024-04-29T11:37:02.000Z | 2024-10-18T09:28:17.267Z |  |  |
| 4a02e38c9389 | twitter:title | Lanista | Web and Mobile App. development partner | Lanista twitter ogtitle | publish | 2024-05-16T11:32:09.000Z | 2024-10-18T09:28:17.285Z |  |  |
| 66a7106a5d6a | twitterSiteId | twitter-site-id | default | publish | 2024-04-29T11:39:20.000Z | 2024-10-18T09:28:17.295Z |  |  |
| 6dcd400f4763 | twitterDescription | We provide end-to-end outsourced web and mobile application development services to drive your business's growth in today's digital world. | default | publish | 2024-04-29T11:38:59.000Z | 2024-10-18T09:28:17.311Z |  |  |

### Lokalize İçerik (Türkçe)

| lang | ID | created_at | updated_at | name | content | description |
| --- | --- | --- | --- | --- | --- | --- |
| tr | 02135e680b44 | 2024-04-29T11:35:46.000Z | 2024-04-29T11:37:31.204Z | ogType | website | default |
| tr | 196caf507337 | 2024-04-29T11:37:02.000Z | 2024-10-18T09:02:07.738Z | ogTitle | Lanista | Web ve Mobile uygulama geliştirme partneriniz | defalt |
| tr | 4a02e38c9389 | 2024-05-16T11:32:09.000Z | 2024-10-18T09:02:34.526Z | twitter:title | Lanista | Web ve Mobile uygulama geliştirme partneriniz | Lanista twitter ogtitle |
| tr | 66a7106a5d6a | 2024-04-29T11:39:20.000Z | 2024-04-29T11:39:52.021Z | twitterSiteId | twitter-site-id | default |
| tr | 6dcd400f4763 | 2024-04-29T11:38:59.000Z | 2024-10-18T09:01:09.158Z | twitterDescription | İşletmenizin günümüz dijital dünyasında büyümesini sağlamak için uçtan uca dış kaynaklı web ve mobil uygulama geliştirme hizmetleri sağlıyoruz. | default |

## Tablo: processes

### Şema

```sql
CREATE TABLE processes (ID TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, icon TEXT NOT NULL, status INTEGER NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, scheduled INTEGER NOT NULL DEFAULT 0, scheduled_at DATETIME)
```

### Varsayılan İçerik (İngilizce)

| ID | title | description | icon | status | created_at | updated_at | scheduled | scheduled_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 96c64803d441 | Research & Analysis | We identify project goals and client needs, conducting in-depth analysis to develop the right, scalable solutions. | ri-search-eye-line | publish | 2024-09-26T13:59:00.000Z | 2024-10-14T06:46:13.160Z |  |  |
| 96c64803d442 | Design & Prototyping | We turn ideas into great designs based on each project’s goals, refining them through client feedback and iterations. | ri-shape-line | publish | 2024-09-26T13:59:00.000Z | 2024-10-14T07:34:08.032Z |  |  |
| 96c64803d443 | Development Stage | We transform designs into fully functional software, integrating key features and making sure the system is ready for testing. | ri-terminal-box-line | publish | 2024-09-26T13:59:00.000Z | 2024-10-14T07:34:08.040Z |  |  |
| 96c64803d444 | Testing Stage | We test the project to identify and resolve any issues with the client. Once approved, we deploy it to the live environment. | ri-test-tube-line | publish | 2024-09-26T13:59:00.000Z | 2024-10-18T10:17:30.139Z |  |  |
| 96c64803d445 | Project Deployment | We deploy the project to a live environment with the right structure, ensuring the product is ready for end users. | ri-rocket-line | publish | 2024-09-26T13:59:00.000Z | 2024-10-14T07:34:08.051Z |  |  |

### Lokalize İçerik (Türkçe)

| lang | ID | created_at | updated_at | title | description | icon |
| --- | --- | --- | --- | --- | --- | --- |
| tr | 96c64803d441 | 2024-09-26T13:59:00.000Z | 2024-10-18T10:14:03.251Z | Araştırma ve Analiz | Proje hedeflerini ve müşteri ihtiyaçlarını belirleyerek, doğru ve ölçeklenebilir çözümleri geliştirmek için analizler yapıyoruz. | ri-search-eye-line |
| tr | 96c64803d442 | 2024-09-26T13:59:00.000Z | 2024-10-18T10:16:03.441Z | Tasarım ve Prototipleme | Her projenin hedeflerine göre fikirleri uygun tasarımlara dönüştürüyor ve süreci müşteri ile birlikte iterasyonlarla ilerletiyoruz. | ri-shape-line |
| tr | 96c64803d443 | 2024-09-26T13:59:00.000Z | 2024-10-18T10:18:49.403Z | Yazılım Geliştirme Aşaması | Tasarımları tam işlevli ürünlere dönüştürüyor, temel özellikleri entegre ediyor ve sistemi test ortamına almak için hazır hale getiriyoruz. | ri-terminal-box-line |
| tr | 96c64803d444 | 2024-09-26T13:59:00.000Z | 2024-10-18T10:37:26.966Z | Test Aşaması | Olası sorunları tespit etmek için projeyi müşteriyle birlikte test ediyoruz ve ardından sorunları çözerek projeyi canlı ortama alıyoruz. | ri-test-tube-line |
| tr | 96c64803d445 | 2024-09-26T13:59:00.000Z | 2024-10-18T10:00:23.252Z | Proje Dağıtımı | Projeyi doğru yapıyla canlı ortama aktarıyoruz ve ürünün son kullanıcıya hazır olmasını sağlıyoruz. | ri-rocket-line |

## Tablo: references_table

### Şema

```sql
CREATE TABLE references_table (ID TEXT PRIMARY KEY, logo TEXT NOT NULL, status INTEGER NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, scheduled INTEGER NOT NULL DEFAULT 0, scheduled_at DATETIME)
```

### Varsayılan İçerik (İngilizce)

| ID | logo | status | created_at | updated_at | scheduled | scheduled_at |
| --- | --- | --- | --- | --- | --- | --- |
| 34e63b4829f0 | public/1728394907608_Popile.svg | publish | 2024-09-27T19:58:20.000Z | 2024-10-08T13:42:57.061Z |  |  |
| 5c5955d57da8 | public/1728394892554_pazardan.svg | publish | 2024-09-27T19:58:54.000Z | 2024-10-09T15:05:43.629Z |  |  |
| 7fa159ae4aaf | public/1728394876736_Contentrain.svg | publish | 2024-09-27T19:58:40.000Z | 2024-10-08T13:42:57.072Z |  |  |
| ae0d98f178d1 | public/1728394832510_Visivi.svg | publish | 2024-09-27T19:59:08.000Z | 2024-10-08T13:42:57.076Z |  |  |
| ca7bedf86bfb | public/1728458840475_Bloomandfresh.svg | publish | 2024-09-27T19:59:01.000Z | 2024-10-09T07:27:46.424Z |  |  |

## Tablo: sections

### Şema

```sql
CREATE TABLE sections (ID TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, buttontext TEXT , buttonlink TEXT , name TEXT NOT NULL, subtitle TEXT , status INTEGER NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, scheduled INTEGER NOT NULL DEFAULT 0, scheduled_at DATETIME)
```

### Varsayılan İçerik (İngilizce)

| ID | title | description | buttontext | buttonlink | name | subtitle | status | created_at | updated_at | scheduled | scheduled_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2aa54f9e7eaf | Explore our expertise in outsourced Development Services | We offer a wide range of software development services, guiding our clients through every step from concept to final product. | See our latest works | #works | services |  | publish | 2024-09-26T18:05:14.000Z | 2024-10-23T08:12:32.375Z |  |  |
| 2aa54f9e7eb0 | Building Success: Our product development approach | We follow a structured approach to ensure each project is delivered on time, with secure architecture, and within budget. | View all works | #works | process |  | publish | 2024-09-26T18:05:14.000Z | 2024-10-18T09:43:28.151Z |  |  |
| 2aa54f9e7eb1 | Trusted by Industry Professionals | Our focus on quality has earned the trust of industry professionals over time. We deliver tailored solutions that meet the highest standards for our clients.
 | View all testimonials | #testimonials | testimonials |  | publish | 2024-09-26T18:05:14.000Z | 2024-10-18T09:43:28.159Z |  |  |
| 2aa54f9e7eb2 | Our recent client works | Explore some of our recent projects where we’ve partnered with clients to turn their ideas into successful products. | View all works | #works | works |  | publish | 2024-09-26T18:05:14.000Z | 2024-10-18T09:43:28.185Z |  |  |
| 2aa54f9e7eb3 | Our technology and tool stack | We love to use Javascript frameworks and the latest technologies to deliver great products. | View all testimonials | #testimonials | tabs |  | publish | 2024-09-26T18:05:14.000Z | 2024-10-18T09:43:28.199Z |  |  |

### Lokalize İçerik (Türkçe)

| lang | ID | created_at | updated_at | title | description | buttontext | buttonlink | name | subtitle |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| tr | 2aa54f9e7eaf | 2024-09-26T18:05:14.000Z | 2024-10-23T08:30:32.237Z | Yazılım geliştirme çözümlerimize göz atın | Müşterilerimize, tasarımdan final ürüne kadar her adımda rehberlik ederek geniş kapsamlı yazılım geliştirme hizmetleri sunuyoruz. | Son projelerimizi inceleyin | #works | services |  |
| tr | 2aa54f9e7eb0 | 2024-09-26T18:05:14.000Z | 2024-10-18T09:36:05.191Z | Ürün geliştirme ve proje yönetme yaklaşımımız | Projenizin zamanında ve bütçe dahilinde teslim edilmesini sağlamak için sistemli bir proje geliştirme süreci izliyoruz. | Tüm çalışmaları görüntüleyin | #works | process |  |
| tr | 2aa54f9e7eb1 | 2024-09-26T18:05:14.000Z | 2024-10-18T09:43:20.869Z | Sektör profesyonelleri tarafından güvenilen bir yazılım geliştirme partneriyiz | Kaliteye odaklanarak çalışmamız zamanla sektör profesyonellerinin güvenini kazandı. Müşterilerimiz için en yüksek standartları karşılayan özel çözümler sunuyoruz. | Tüm referanslar | #testimonials | testimonials |  |
| tr | 2aa54f9e7eb2 | 2024-09-26T18:05:14.000Z | 2024-10-18T09:40:26.946Z | Müşterilerimiz için geliştirdiğimiz bazı projeler | Müşterilerimizin fikirlerini geliştirerek başarılı ürünlere dönüştürdüğümüz projelerimizden bazılarını inceleyin. | Tüm çalışmaları görüntüleyin | #works | works |  |
| tr | 2aa54f9e7eb3 | 2024-09-26T18:05:14.000Z | 2024-10-18T09:38:31.523Z | Kullandığımız teknolojiler ve geliştirme araçları  | Harika ürünler ortaya çıkarmak için Javascript teknolojilerini ve güncel araçları kullanmayı seviyoruz. | Tüm referanslar | #testimonials | tabs |  |

## Tablo: services

### Şema

```sql
CREATE TABLE services (ID TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT , image TEXT , reference TEXT , status INTEGER NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, scheduled INTEGER NOT NULL DEFAULT 0, scheduled_at DATETIME)
```

### Varsayılan İçerik (İngilizce)

| ID | title | description | image | reference | status | created_at | updated_at | scheduled | scheduled_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 50d81f2a3baf | Web App. Development | From concept to launch, we deliver custom web apps that are secure, scalable, and designed to meet your business needs. | public/1729868379116_Webapp.svg | 34e63b4829f0 | publish | 2024-10-14T10:32:18.000Z | 2024-10-25T15:00:08.321Z |  |  |
| 9450777bee2f | Mobile App. Development | We develop custom iOS and Android mobile apps to turn our clients' ideas into real mobile experiences. | public/1729765510539_Mobileapp.svg | 5c5955d57da8 | publish | 2024-10-14T10:33:10.000Z | 2024-10-24T10:27:07.330Z |  |  |
| d00761480436 | MVP Development | Helping startups bring their ideas to life with MVP development services. | public/1729767526420_MVP.svg | 7fa159ae4aaf | publish | 2024-09-26T18:04:41.000Z | 2024-10-24T10:59:32.680Z |  |  |
| d00761480437 | SaaS Platform Development | We provide end-to-end custom SaaS platform development solutions.  | public/1729844595854_SaaS.svg |  | publish | 2024-09-26T18:04:41.000Z | 2024-10-25T08:24:14.428Z |  |  |
| d00761480438 | Product Design | Crafting product designs that blend functionality with modern aesthetics. | public/1729849903212_ProductDesign.svg |  | publish | 2024-09-26T18:04:41.000Z | 2024-10-25T09:52:10.988Z |  |  |

### Lokalize İçerik (Türkçe)

| lang | ID | created_at | updated_at | title | description | image |
| --- | --- | --- | --- | --- | --- | --- |
| tr | 50d81f2a3baf | 2024-10-14T10:32:18.000Z | 2024-10-25T15:00:08.323Z | Web Uygulama Geliştirme | Konseptten lansmana kadar güvenli, ölçeklenebilir ve iş ihtiyaçlarınızı karşılayacak şekilde tasarlanmış özel web uygulamaları geliştiriyoruz. | public/1729868379116_Webapp.svg |
| tr | 9450777bee2f | 2024-10-14T10:33:10.000Z | 2024-10-24T10:27:13.551Z | Mobil Uygulama Geliştirme | Müşterilerimizin fikirlerini gerçek mobil deneyimlere dönüştürebilmek için özel IOS ve Android uygulamalar geliştiriyoruz. | public/1729765510539_Mobileapp.svg |
| tr | d00761480436 | 2024-09-26T18:04:41.000Z | 2024-10-24T10:59:32.684Z | MVP Geliştirme | Startuplara, fikirlerini hayata geçirebilmeleri için deneyimli bir ekiple birlikte MVP geliştirme hizmeti sunuyoruz. | public/1729767526420_MVP.svg |
| tr | d00761480437 | 2024-09-26T18:04:41.000Z | 2024-10-25T08:24:14.431Z | SaaS Platform Geliştirme | Startuplara ve kurumsal firmalara ihtiyaç duydukları uçtan uca SaaS platform geliştirme çözümleri sağlıyoruz. | public/1729844595854_SaaS.svg |
| tr | d00761480438 | 2024-09-26T18:04:41.000Z | 2024-10-25T09:52:10.991Z | Ürün Tasarımı | İşlevselliği modern estetikle harmanlayan ürün tasarımları üretiyoruz. | public/1729849903212_ProductDesign.svg |

## Tablo: services_reference

### Şema

```sql
CREATE TABLE services_reference (
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (source_id, target_id),
        FOREIGN KEY (source_id) REFERENCES services(ID) ON DELETE CASCADE,
        FOREIGN KEY (target_id) REFERENCES references_table(ID) ON DELETE CASCADE
      )
```

### Varsayılan İçerik (İngilizce)

| source_id | target_id | created_at |
| --- | --- | --- |
| 50d81f2a3baf | 34e63b4829f0 | 2025-01-26 20:54:21 |
| 9450777bee2f | 5c5955d57da8 | 2025-01-26 20:54:21 |
| d00761480436 | 7fa159ae4aaf | 2025-01-26 20:54:21 |

## Tablo: sociallinks

### Şema

```sql
CREATE TABLE sociallinks (ID TEXT PRIMARY KEY, link TEXT NOT NULL, icon TEXT NOT NULL, service TEXT , status INTEGER NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, scheduled INTEGER NOT NULL DEFAULT 0, scheduled_at DATETIME)
```

### Varsayılan İçerik (İngilizce)

| ID | link | icon | service | status | created_at | updated_at | scheduled | scheduled_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2aa54f9e7eaf | https://www.linkedin.com/company/lanista-software | ri-linkedin-line | 50d81f2a3baf | publish | 2024-09-26T18:05:14.000Z | 2024-10-22T10:40:07.059Z |  |  |
| 2aa54f9e7eb1 | https://x.com/lanistasoftware | ri-twitter-line | 9450777bee2f | publish | 2024-09-26T18:05:14.000Z | 2024-10-22T09:35:21.910Z |  |  |
| 2aa54f9e7eb2 | https://www.instagram.com/lanistasoftware/ | ri-instagram-line | d00761480436 | publish | 2024-09-26T18:05:14.000Z | 2024-10-22T10:40:07.066Z |  |  |

## Tablo: sociallinks_service

### Şema

```sql
CREATE TABLE sociallinks_service (
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (source_id, target_id),
        FOREIGN KEY (source_id) REFERENCES sociallinks(ID) ON DELETE CASCADE,
        FOREIGN KEY (target_id) REFERENCES services(ID) ON DELETE CASCADE
      )
```

### Varsayılan İçerik (İngilizce)

| source_id | target_id | created_at |
| --- | --- | --- |
| 2aa54f9e7eaf | 50d81f2a3baf | 2025-01-26 20:54:21 |
| 2aa54f9e7eb1 | 9450777bee2f | 2025-01-26 20:54:21 |
| 2aa54f9e7eb2 | d00761480436 | 2025-01-26 20:54:21 |

## Tablo: tabitems

### Şema

```sql
CREATE TABLE tabitems (ID TEXT PRIMARY KEY, link TEXT NOT NULL, description TEXT NOT NULL, image TEXT NOT NULL, category TEXT NOT NULL, status INTEGER NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, scheduled INTEGER NOT NULL DEFAULT 0, scheduled_at DATETIME)
```

### Varsayılan İçerik (İngilizce)

| ID | link | description | image | category | status | created_at | updated_at | scheduled | scheduled_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3442ac47e4cc | https://www.adobe.com/tr/products/photoshop.html | Adobe Photoshop is a widely used graphic design and image editing software developed by Adobe. It is primarily used for editing photos, creating digital artwork, and designing graphics for both print and web. | public/1728898765927_Photoshop.svg | ["cab37361e7e8"] | publish | 2024-10-14T09:50:29.000Z | 2024-10-25T17:11:37.612Z |  |  |
| 9ab7dcca9d1d | https://vuejs.org/ | Vue.js is a progressive JavaScript framework used for building user interfaces, especially single-page applications. It is designed to be incrementally adoptable and integrates well with other libraries. | public/1728541493988_vuejs.svg | ["cab37361e7e6","cab37361e7e8"] | publish | 2024-09-26T18:06:53.000Z | 2024-10-25T17:11:37.618Z |  |  |
| 9ab7dcca9d1e | https://reactjs.dev/ | React.js is a JavaScript library for building user interfaces or UI components. It is maintained by Facebook and a large community of developers. React is known for its fast rendering and virtual DOM. | public/1728541679333_react.svg | ["cab37361e7e6","cab37361e7e8"] | publish | 2024-09-26T18:06:53.000Z | 2024-10-25T17:11:37.623Z |  |  |
| 9ab7dcca9d1f | https://nuxtjs.com/ | Nuxt.js is a framework built on top of Vue.js that simplifies the development of server-rendered applications and static websites. It offers powerful features like SSR, static site generation, and improved SEO support. | public/1728541702569_nuxt.svg | ["cab37361e7e6","cab37361e7e8"] | publish | 2024-09-26T18:06:53.000Z | 2024-10-25T17:11:37.628Z |  |  |
| 9ab7dcca9d20 | https://nextjs.org/ | Next.js is a React framework that enables functionality such as server-side rendering and static website generation for building high-performance, SEO-friendly applications. | public/1728541725437_next.svg | ["cab37361e7e6","cab37361e7e8"] | publish | 2024-09-26T18:06:53.000Z | 2024-10-25T17:11:37.632Z |  |  |

### Lokalize İçerik (Türkçe)

| lang | ID | created_at | updated_at | link | description | image |
| --- | --- | --- | --- | --- | --- | --- |
| tr | 3442ac47e4cc | 2024-10-14T09:50:29.000Z | 2024-10-25T17:11:43.293Z | https://www.adobe.com/tr/products/photoshop.html | Adobe Photoshop, Adobe tarafından geliştirilen ve yaygın olarak kullanılan bir grafik tasarım ve görüntü düzenleme yazılımıdır. Başlıca fotoğraf düzenleme, dijital sanat eseri oluşturma ve hem baskı hem de web için grafik tasarımı amacıyla kullanılır. | public/1728898765927_Photoshop.svg |
| tr | 9ab7dcca9d1d | 2024-09-26T18:06:53.000Z | 2024-10-25T17:11:43.303Z | https://vuejs.org/ | Vue.js Javascript tabanlı bir frameworktür. Vue.js, kullanıcı arayüzleri ve UI bileşenleri oluşturmak için kullanılan bir JavaScript kütüphanesidir. Facebook ve büyük bir geliştirici topluluğu tarafından sürdürülmektedir. Vue, hızlı renderlama ve sanal DOM ile bilinir. | public/1728541493988_vuejs.svg |
| tr | 9ab7dcca9d1e | 2024-09-26T18:06:53.000Z | 2024-10-25T17:11:43.310Z | https://reactjs.dev/ | React.js, kullanıcı arayüzleri veya UI bileşenleri oluşturmak için kullanılan bir JavaScript kütüphanesidir. Facebook ve büyük bir geliştirici topluluğu tarafından sürdürülmektedir. React, hızlı renderlama ve sanal DOM ile bilinir. | public/1728541679333_react.svg |
| tr | 9ab7dcca9d1f | 2024-09-26T18:06:53.000Z | 2024-10-25T17:11:43.315Z | https://nuxtjs.com/ | Nuxt.js, Vue.js üzerine inşa edilmiş bir frameworktür. Sunucu tarafında render edilen uygulamaların ve statik web sitelerinin geliştirilmesini kolaylaştırır. SSR, statik site oluşturma ve geliştirilmiş SEO desteği gibi güçlü özellikler sunar. | public/1728541702569_nuxt.svg |
| tr | 9ab7dcca9d20 | 2024-09-26T18:06:53.000Z | 2024-10-25T17:11:43.322Z | https://nextjs.org/ | Next.js, yüksek performanslı, SEO dostu uygulamalar oluşturmak için sunucu tarafında renderlama ve statik web sitesi oluşturma gibi işlevleri etkinleştiren bir React çerçevesidir. | public/1728541725437_next.svg |

## Tablo: tabitems_category

### Şema

```sql
CREATE TABLE tabitems_category (
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (source_id, target_id),
        FOREIGN KEY (source_id) REFERENCES tabitems(ID) ON DELETE CASCADE,
        FOREIGN KEY (target_id) REFERENCES workcategories(ID) ON DELETE CASCADE
      )
```

### Varsayılan İçerik (İngilizce)

| source_id | target_id | created_at |
| --- | --- | --- |
| 3442ac47e4cc | cab37361e7e8 | 2025-01-26 20:54:21 |
| 9ab7dcca9d1d | cab37361e7e6 | 2025-01-26 20:54:21 |
| 9ab7dcca9d1d | cab37361e7e8 | 2025-01-26 20:54:21 |
| 9ab7dcca9d1e | cab37361e7e6 | 2025-01-26 20:54:21 |
| 9ab7dcca9d1e | cab37361e7e8 | 2025-01-26 20:54:21 |

## Tablo: testimonail_items

### Şema

```sql
CREATE TABLE testimonail_items (ID TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, title TEXT NOT NULL, image TEXT NOT NULL, creative_work TEXT NOT NULL, status INTEGER NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, scheduled INTEGER NOT NULL DEFAULT 0, scheduled_at DATETIME)
```

### Varsayılan İçerik (İngilizce)

| ID | name | description | title | image | creative_work | status | created_at | updated_at | scheduled | scheduled_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 89ae53eb8370 | Ertuğrul Uçar | Lanista Software supported Popile’s frontend and backend in its early stages, helping us improve our work. | CEO, Popile | public/1728463995414_ertugrul.jpeg | 51bf2dbbed29 | publish | 2024-10-13T11:24:25.000Z | 2024-10-16T11:10:08.066Z |  |  |
| b770c71013d2 | Murat Sus | The team has a great ability to resolve any problem by adapting innovative technologies and approaches. | Co-Founder, Bloom and Fresh | public/1729164933955_murat.png | 8a8044e883e9 | publish | 2024-10-16T11:26:26.000Z | 2024-10-17T11:37:05.703Z |  |  |
| c421eb634cfa | Ege Büyüktaşkın | Lanista Software worked closely with my team to bring my idea to life, making the whole process smooth. | Founder, Visivi | public/1728464446315_ege.jpeg | 8a8044e883eb | publish | 2024-10-16T11:31:21.000Z | 2024-10-16T11:31:21.000Z |  |  |

### Lokalize İçerik (Türkçe)

| lang | ID | created_at | updated_at | name | description | title | image |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tr | 89ae53eb8370 | 2024-10-13T11:24:25.000Z | 2024-10-16T11:10:08.070Z | Ertuğrul Uçar | Lanista Software, Popile’nin ilk aşamalarında bize Frontend ve Backend tarafında destek oldu, bu da işimizi daha iyi hale getirmemizi sağladı. | CEO, Popile | public/1728463995414_ertugrul.jpeg |
| tr | b770c71013d2 | 2024-10-16T11:26:26.000Z | 2024-10-17T11:37:05.705Z | Murat Sus | Lanista ekibi, yenilikçi teknoloji ve yaklaşımları benimseyerek her türlü sorunu çözme konusunda büyük bir yeteneğe sahip. | Co-Founder, Bloom and Fresh | public/1729164933955_murat.png |
| tr | c421eb634cfa | 2024-10-16T11:31:21.000Z | 2024-10-16T11:31:21.000Z | Ege Büyüktaşkın | Lanista Yazılım, ekibimle yakın iş birliği içinde çalışarak fikrimi hayata geçirdi ve süreci çok daha kolay hale getirdi. | Kurucu, Visiv | public/1728464446315_ege.jpeg |

## Tablo: testimonail_items_creative_work

### Şema

```sql
CREATE TABLE testimonail_items_creative_work (
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (source_id, target_id),
        FOREIGN KEY (source_id) REFERENCES testimonail_items(ID) ON DELETE CASCADE,
        FOREIGN KEY (target_id) REFERENCES workitems(ID) ON DELETE CASCADE
      )
```

### Varsayılan İçerik (İngilizce)

| source_id | target_id | created_at |
| --- | --- | --- |
| 89ae53eb8370 | 51bf2dbbed29 | 2025-01-26 20:54:21 |
| b770c71013d2 | 8a8044e883e9 | 2025-01-26 20:54:21 |
| c421eb634cfa | 8a8044e883eb | 2025-01-26 20:54:21 |

## Tablo: workcategories

### Şema

```sql
CREATE TABLE workcategories (ID TEXT PRIMARY KEY, category TEXT NOT NULL UNIQUE, order_field INTEGER NOT NULL, status INTEGER NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, scheduled INTEGER NOT NULL DEFAULT 0, scheduled_at DATETIME)
```

### Varsayılan İçerik (İngilizce)

| ID | category | order_field | status | created_at | updated_at | scheduled | scheduled_at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 59cbdac46c1e | Web Design & Development | 6 | publish | 2024-10-16T08:08:46.000Z | 2024-10-16T08:08:46.000Z |  |  |
| 8ac7d8c79484 | Support & Maintenance | 7 | publish | 2024-10-16T10:49:43.000Z | 2024-10-16T10:49:43.000Z |  |  |
| b5debb48ccb2 | Mobile App. Development | 8 | publish | 2024-10-16T11:02:44.000Z | 2024-10-16T11:02:44.000Z |  |  |
| bcc834108adc | Product Development | 9 | publish | 2024-10-16T08:02:51.000Z | 2024-10-16T08:02:51.000Z |  |  |
| cab37361e7e6 | Frontend Development | 1 | publish | 2024-09-26T18:05:55.000Z | 2024-09-26T18:05:55.000Z |  |  |

### Lokalize İçerik (Türkçe)

| lang | ID | created_at | updated_at | category | order_field |
| --- | --- | --- | --- | --- | --- |
| tr | 59cbdac46c1e | 2024-10-16T08:08:46.000Z | 2024-10-16T08:08:46.000Z | Web Tasarım ve Geliştirme | 6 |
| tr | 8ac7d8c79484 | 2024-10-16T10:49:43.000Z | 2024-10-16T10:49:43.000Z | Destek ve Bakım | 7 |
| tr | b5debb48ccb2 | 2024-10-16T11:02:44.000Z | 2024-10-16T11:02:44.000Z | Mobil Uygulama Geliştirme | 8 |
| tr | bcc834108adc | 2024-10-16T08:02:51.000Z | 2024-10-16T08:02:51.000Z | Ürün Geliştirme | 9 |
| tr | cab37361e7e6 | 2024-09-26T18:05:55.000Z | 2024-09-26T18:05:55.000Z | Frontend Geliştirme | 1 |

## Tablo: workitems

### Şema

```sql
CREATE TABLE workitems (ID TEXT PRIMARY KEY, title TEXT NOT NULL, image TEXT , description TEXT NOT NULL, category TEXT NOT NULL, link TEXT NOT NULL, order_field INTEGER NOT NULL, status INTEGER NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, scheduled INTEGER NOT NULL DEFAULT 0, scheduled_at DATETIME)
```

### Varsayılan İçerik (İngilizce)

| ID | title | image | description | category | link | order_field | status | created_at | updated_at | scheduled | scheduled_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1a01328952b4 | Pazardan | public/1729875780702_pazardan.svg | Pazardan is an online marketplace for ordering vegetables and fruits from local groceries. 

We developed the mobile application with React Native, making it cross-platform for iOS and Android. The web platform was developed with React.js and Next.js. | cab37361e7e6 | https://pazardan.app/ | 7 | publish | 2024-10-16T10:27:21.000Z | 2024-10-25T17:03:30.448Z |  |  |
| 51bf2dbbed29 | Popile | public/1729874670881_popile.svg | Popile is the meeting point of data and creativity in influencer marketing. We made improvements on the frontend using Vue.js, supported payment system integrations, and optimized the backend for better performance. | 8ac7d8c79484 | https://www.popile.com/ | 4 | publish | 2024-10-16T10:45:44.000Z | 2024-10-25T16:45:21.855Z |  |  |
| 8a8044e883e8 | Contentrain | public/1729065603135_denemecontentrain.svg | Contentrain is a scalable content management platform combining Git and serverless platforms.

We planned the entire project workflow, designed the software architecture, developed the frontend and backend, structured the database, and integrated all components before deployment. | bcc834108adc | https://contentrain.io/ | 1 | publish | 2024-09-26T18:08:38.000Z | 2024-10-16T08:03:22.597Z |  |  |
| 8a8044e883e9 | Bloom and Fresh | public/1729874043253_Bloomandfresh.svg | Bloom & Fresh is an eCommerce platform specializing in floral arrangements and gifts.

We modernized the frontend with Vue.js and Nuxt.js, integrating it with the client's existing backend system. | cab37361e7e6 | https://bloomandfresh.com | 2 | publish | 2024-09-26T18:08:38.000Z | 2024-10-25T16:38:01.208Z |  |  |
| 8a8044e883ea | Wordify | public/1729066309718_wordify.svg | We transformed Wordify's Squarespace-based website into a custom site using Jamstack architecture. This upgrade provided Wordify with a smooth look, enhanced performance, scalability, and improved user experience. | cab37361e7ea | https://www.wordify.co/ | 3 | publish | 2024-09-26T18:08:38.000Z | 2024-10-16T08:13:12.448Z |  |  |

### Lokalize İçerik (Türkçe)

| lang | ID | created_at | updated_at | title | image | description | link | order_field |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| tr | 1a01328952b4 | 2024-10-16T10:27:21.000Z | 2024-10-25T17:03:30.451Z | Pazardan | public/1729875780702_pazardan.svg | Pazardan, yerel marketlerden sebze ve meyve siparişi vermek için bir çevrimiçi pazar yeridir.

Mobil uygulamayı React Native ile geliştirdik ve iOS ve Android için çapraz platform haline getirdik. Web platformu ise React.js ve Next.js ile geliştirildi. | https://pazardan.app/ | 7 |
| tr | 51bf2dbbed29 | 2024-10-16T10:45:44.000Z | 2024-10-25T16:45:21.859Z | Popile | public/1729874670881_popile.svg | Popile, influencer pazarlamasında veri ve yaratıcılığın buluşma noktasıdır. Frontend tarafında Vue.js ile iyileştirmeler yaptık, ödeme sistemi entegrasyonlarında destek sağladık ve backend tarafında performans optimizasyonları gerçekleştirdik. | https://www.popile.com/ | 4 |
| tr | 8a8044e883e8 | 2024-09-26T18:08:38.000Z | 2024-10-25T16:49:44.612Z | Contentrain | public/1729065603135_denemecontentrain.svg | Contentrain, Git ve serverless platformları birleştiren, ölçeklenebilir bir içerik yönetim platformudur.

Tüm proje iş akışını planladık, yazılım mimarisini tasarladık, frontend ve backend geliştirmelerini yaptık, veritabanını yapılandırdık ve tüm bileşenleri dağıtımdan önce entegre ettik. | https://contentrain.io/ | 1 |
| tr | 8a8044e883e9 | 2024-09-26T18:08:38.000Z | 2024-10-25T16:38:01.211Z | Bloom and Fresh | public/1729874043253_Bloomandfresh.svg | Bloom & Fresh, çiçek aranjmanları ve hediyeler konusunda uzmanlaşmış bir e-ticaret platformudur.

Frontend kısmını Vue.js ve Nuxt.js ile modernize ettik ve bunu müşterinin mevcut Backend sistemiyle entegre ettik. | https://bloomandfresh.com | 2 |
| tr | 8a8044e883ea | 2024-09-26T18:08:38.000Z | 2024-10-16T08:13:12.451Z | Wordify | public/1729066309718_wordify.svg | Wordify'ın Squarespace tabanlı web sitesini Jamstack mimarisini kullanarak özel bir siteye dönüştürdük. Bu yükseltme Wordify'a pürüzsüz bir görünüm, gelişmiş performans, ölçeklenebilirlik ve iyileştirilmiş kullanıcı deneyimi sağladı. | https://www.wordify.co/ | 3 |

## Tablo: workitems_category

### Şema

```sql
CREATE TABLE workitems_category (
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (source_id, target_id),
        FOREIGN KEY (source_id) REFERENCES workitems(ID) ON DELETE CASCADE,
        FOREIGN KEY (target_id) REFERENCES workcategories(ID) ON DELETE CASCADE
      )
```

### Varsayılan İçerik (İngilizce)

| source_id | target_id | created_at |
| --- | --- | --- |
| 1a01328952b4 | cab37361e7e6 | 2025-01-26 20:54:21 |
| 51bf2dbbed29 | 8ac7d8c79484 | 2025-01-26 20:54:21 |
| 8a8044e883e8 | bcc834108adc | 2025-01-26 20:54:21 |
| 8a8044e883e9 | cab37361e7e6 | 2025-01-26 20:54:21 |
| 8a8044e883ea | cab37361e7ea | 2025-01-26 20:54:21 |

