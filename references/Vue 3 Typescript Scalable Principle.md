Building Scalable Vue.js Applications: A Modular Approach
Darwishdev
Darwishdev

Follow
7 min read
·
Oct 4, 2024
102

Press enter or click to view image in full size

Introduction
In my previous article, “Structuring Go Applications: A Practical Approach,” I addressed the challenges of organizing complex Go applications. Building upon that foundation, this article focuses on structuring Vue.js applications for scalability and maintainability. While the default Vue.js project structure works well for smaller applications, it can become increasingly difficult to manage as complexity grows. To address these challenges, we’ll explore a modular approach that promotes code reusability, testability, and maintainability.

The Default Vue.js Project Structure
The Default Vue.js Project Structure

my-vue-app/
├── node_modules/ # Installed dependencies
├── public/ # Static files
│ ├── favicon.ico # Favicon
│ └── index.html # Main HTML file
├── src/ # Source code
│ ├── assets/ # Assets like images, fonts, etc.
│ ├── components/ # Vue components
│ ├── views/ # View components for routing
│ ├── router/ # Vue Router configuration
│ ├── store/ # Vuex store (state management)
│ ├── App.vue # Root component
│ ├── main.ts # Entry point of the application
│ └── styles/ # Global styles (CSS or SCSS)
├── tests/ # Unit and integration tests
├── .env # Environment variables
├── .gitignore # Git ignore file
├── package.json # Project metadata and dependencies
├── package-lock.json # Lock file for dependencies
├── tsconfig.json # TypeScript configuration (if using TypeScript)
└── vite.config.js # Vite configuration (if using Vite)
This structure is suitable for smaller applications, as it provides a clear separation of concerns. However, as the application grows, maintaining this structure can become cumbersome due to tight coupling between components and the difficulty in managing deeply nested components.

Issues with Scalability and Coupling
As applications scale, the default structure can lead to several problems:

Tight Coupling: Components often become tightly coupled , making it difficult to reuse or modify them independently.
Tight Coupling Means that changes to a component or view can have unintended consequences in other parts of the application. This is especially problematic when components are used across multiple modules without a clear central reference

Difficulty in Scaling: Managing a large codebase with deeply nested components can be challenging, leading to decreased maintainability.
Fragmented Logic: Logic may be spread across multiple files and folders, making it difficult to understand and modify.
Collaboration Challenges: Working in teams can be difficult when multiple developers are modifying the same files or folders. This can increase the risk of merge conflicts and make it harder to maintain a consistent codebase.
Introducing a Modular Approach
To address these issues, we propose a modular approach: organizing each major section of the application into its own module under src/app.

Example Structure:

├── src
│ ├── App.vue
│ ├── tests
│ ├── app
│ │ └── landing
│ │ ├── tests
│ │ ├── components
│ │ ├── data
│ │ ├── forms
│ │ ├── routes.ts
│ │ └── views
│ └── shop
│ │ ├── components
│ │ ├── data
│ │ ├── forms
│ │ ├── routes.ts
│ │ └── views
│ ├── main.ts
│ ├── router/  
│ ├── store/  
│ ├── App.vue
│ └── vite-env.d.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
This modular approach improves maintainability and reduces coupling by:

Encapsulating Functionality: Each module has a clear boundary of responsibility, making it easier to understand and modify.
Promoting Reusability: Components and logic within a module can be reused across different modules if applicable.
Facilitating Collaboration: Teams can work independently on different modules, reducing the risk of conflicts and improving development efficiency.
Creating a common/ Folder for Reusable Code
The src/common folder can be used to centralize code that is used across multiple modules, such as:

Global components
IndexedDB setup
Common stores
Common utilities and plugins
This reduces duplication and improves maintainability.

Become a member
now our structure should be like this

├── public
├── src
│ ├── App.vue
│ ├── app
│ │ └── landing
│ │ ├── components
│ │ ├── data
│ │ ├── forms
│ │ ├── routes.ts
│ │ └── views
│ ├── common
│ │ ├── adapters
│ │ ├── api
│ │ │ └── ApiClient.ts
│ │ ├── components
│ │ │ ├── AppFooter.vue
│ │ │ ├── AppNav.vue
│ │ │ ├── Loading.vue
│ │ ├── db
│ │ │ ├── base.ts
│ │ │ ├── db.ts
│ │ │ └── types.ts
│ │ ├── i18n
│ │ │ ├── i18n.ts
│ │ │ └── locales
│ │ ├── primevue
│ │ │ └── primevue.ts
│ │ ├── routes
│ │ │ └── routes.ts
│ │ ├── stores
│ │ │ ├── global.ts
│ │ │ ├── theme.ts
│ │ ├── styles
│ │ │ ├── \_animation.css
│ │ │ ├── \_btn.css
│ │ │ ├── \_font.css
│ │ │ ├── \_nav.css
│ │ │ ├── \_reset.css
│ │ │ ├── \_utilities.css
│ │ │ ├── \_variables.css
│ │ │ └── styles.css
│ │ ├── types
│ │ │ └── types.ts
│ │ └── utilites
│ │ ├── animation.ts
│ │ └── path.ts
│ ├── main.ts
│ └── vite-env.d.ts
├── tsconfig.app.json
├── README.md
├── index.html
├── package-lock.json
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
Benefits of Using Suspense with Async Components and Nested Routes
In modern web applications, user experience plays a crucial role in retaining users and ensuring their satisfaction. One effective way to enhance user experience in Vue.js applications is by utilizing Suspense alongside async components and nested routes. Here are some of the key benefits:

Improved User Experience: By displaying a loading state while async components are being fetched, users are informed that something is happening in the background. This prevents the application from appearing unresponsive.
Optimized Performance: Lazy-loading components allows you to split your application into smaller chunks. This means that only the components needed at a specific moment are loaded, reducing the initial load time and improving performance.
Setting Up the App.vue File
To start implementing this approach, we first need to configure our App.vue file. Below is a sample code snippet for App.vue that leverages Suspense and a RouterView:

<template>
  <RouterView v-slot="{ Component }">
    <Suspense>
      <component :is="Component"></component>

      <template #fallback>
        <Loading />
      </template>
    </Suspense>

  </RouterView>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import Loading from '@/common/components/Loading.vue';
</script>

Configuring Routes in routes.ts
Next, we’ll set up our routes configuration in routes.ts, defining a route that points to an AppLayout component. This layout will serve as a wrapper for our main content:

import { createRouter, createWebHistory, } from 'vue-router'
import AppLayout from '@/common/components/AppLayout.vue'

const router = createRouter({
history: createWebHistory(import.meta.env.BASE_URL),
routes: [
{
path: '/',
component: AppLayout,
redirect: '/landing',
children: appRoutes
},
],
})

export default router;
Creating the AppLayout Component
Now, let’s create the AppLayout.vue component. This component will include navigation, a footer, and a nested RouterView to handle the main content of the application:

<!-- AppLayout.vue -->
<template>
  <AppNav />
  <RouterView v-slot="{ Component }">
    <template v-if="Component">
      <KeepAlive>
        <Suspense>
          <!-- Main Content -->
          <component :is="Component"></component>

          <!-- Loading State -->
          <template #fallback>
            <div class="h-screen flex justify-content-center align-items-center">
              <Loading />
            </div>
          </template>
        </Suspense>
      </KeepAlive>
    </template>

  </RouterView>
  <AppFooter />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import AppNav from '@/common/components/AppNav.vue';
import AppFooter from '@/common/components/AppFooter.vue';
import Loading from '@/common/components/Loading.vue'; // Import Loading component
// Assuming we have a global store for initialization
import { useGlobalStore } from '@/common/stores/global';
const globalStore = useGlobalStore();
await globalStore.initialCalls();
</script>

Modularizing Routes in Vue.js with the Spread Operator
When building large applications, managing routes can become cumbersome. To tackle this, we can modularize our routes by placing them in separate files or folders for each feature or module. This not only makes our code cleaner but also enhances collaboration within teams. By utilizing the spread operator (...), we can easily merge these modular routes into our main routing configuration.

Example: Final routes.ts Implementation

import LandingView from './views/Landing.vue'
export default
[
{
path: 'landing',
name: 'landing_view',
component: LandingView
},
]
Example: Final routes.ts Implementation

Here’s how you can structure your routes.ts file to include modular routes using the spread operator:

import { createRouter, createWebHistory, } from 'vue-router'
import AppLayout from '@/common/components/AppLayout.vue'

import landingRoutes from '@/app/landing/routes';

const appRoutes = [
...landingRoutes,
]

const router = createRouter({
history: createWebHistory(import.meta.env.BASE_URL),
routes: [
{
path: '/',
component: AppLayout,
redirect: '/landing',
children: appRoutes
},
],
})

export default router;
Modular Approach: Solving Inter-module Dependencies

One of the significant advantages of the modular approach is its ability to address the issue of inter-module dependencies. By bundling all the usages of a component within its respective module, we can:

Improve Code Organization: The modular structure provides a clear and logical way to organize components and their dependencies.
Reduce Complexity: By keeping related components and their usages together, we can simplify the development and maintenance process.
Enhance Testability: Isolating components within their modules makes it easier to write unit tests and ensure their correctness.
Facilitate Code Refactoring: When refactoring a component, we can focus on the module that contains it, minimizing the impact on other parts of the application.
Teaser: Building a Real-World App Using This Architecture
As we conclude this exploration of scalable and modular architecture for Vue.js applications, it’s time to look ahead to our next adventure. In the upcoming article, we’ll put this architecture to the test by building a real-world project that showcases its practical application.

Imagine a fully functional web application that seamlessly integrates Vue.js for the frontend and Golang for the backend. This project will not only highlight the benefits of the modular structure we’ve discussed, but also demonstrate how to effectively manage and organize code across different layers of the application.

We’ll dive deeper into the principles of constructing a large-scaale website, focusing on the architecture we’ve laid out in this article. Expect to see how each module interacts, how data flows between the frontend and backend, and how best practices can elevate your application’s performance and maintainability.
