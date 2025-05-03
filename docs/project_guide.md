# Vanilla JavaScript Architecture: A Modern Approach

## Table of Contents
- [Introduction](#introduction)
- [DOM Structure and Manipulation](#dom-structure-and-manipulation)
- [Event Delegation and Bubbling](#event-delegation-and-bubbling)
- [State Management Without Frameworks](#state-management-without-frameworks)
- [Model-View-Controller Pattern](#model-view-controller-pattern)
- [The Event Bus Pattern](#the-event-bus-pattern)
- [Progressive Enhancement](#progressive-enhancement)
- [Accessibility Considerations](#accessibility-considerations)
- [JavaScript Module Patterns](#javascript-module-patterns)
- [Build vs. Runtime Composition](#build-vs-runtime-composition)
- [Why Choose Vanilla JS](#why-choose-vanilla-js)
- [Key Takeaways](#key-takeaways)
- [Glossary](#glossary)

## Introduction

This guide explores the architectural patterns and design decisions behind our interactive visualization tool built with vanilla JavaScript. Modern web development often reaches for frameworks immediately, but understanding the fundamentals allows for more intentional architectural choices that can result in lighter, more performant applications.

By the end of this guide, you'll understand how we architected a complex interactive application without frameworks, using patterns that promote maintainability, performance, and accessibility.

> ℹ️ Tip: Even if you plan to use frameworks in your projects, understanding these vanilla JavaScript patterns will make you a more effective developer regardless of your toolkit.

## DOM Structure and Manipulation

At the core of any web application is the Document Object Model (DOM), a tree-like representation of HTML documents that browsers create. Effective DOM manipulation is crucial for interactive applications.

### Historical Context

Early web interactivity relied on direct DOM manipulation, with developers manually selecting elements and changing their properties. This approach was error-prone and difficult to maintain. Libraries like jQuery emerged around 2006 to abstract away browser inconsistencies and provide a simpler API for DOM manipulation.

### In Our Application

We use a DOMRenderer class that abstracts all DOM interactions, providing methods that make changes to the document structure. This separation ensures we can modify how we interact with the DOM without changing our business logic.

```javascript
// DOM manipulation abstracted into a dedicated service
class DOMRenderer {
  updateStyle(element, styleProps) {
    const el = typeof element === 'string' 
      ? document.getElementById(element) 
      : element;
    
    if (!el) return;
    
    Object.entries(styleProps).forEach(([prop, value]) => {
      el.style[prop] = value;
    });
  }
  
  updateText(element, text) {
    const el = typeof element === 'string' 
      ? document.getElementById(element) 
      : element;
    
    if (!el) return;
    el.textContent = text;
  }
}
```

This abstraction provides several benefits:

1. Centralized DOM manipulation makes the codebase more maintainable
2. Changes to how we interact with the DOM only need to happen in one place
3. Testing becomes easier as DOM operations are isolated

### Common Alternatives

| Approach | Description | When to Use |
|----------|-------------|-------------|
| **Direct DOM API** | Using `document.querySelector()` throughout your code | Simple applications with minimal DOM interactions |
| **Virtual DOM** (React) | Creating a virtual representation of the DOM that gets reconciled | Complex applications with frequent UI updates |
| **Web Components** | Using custom elements with encapsulated functionality | Component-based architecture with browser-native features |

### Pros and Cons

| Pros | Cons |
|------|------|
| No additional libraries required | More verbose than framework alternatives |
| Full control over DOM operations | Requires discipline to maintain separation of concerns |
| Browser-native performance | You must manage browser inconsistencies yourself |
| No framework overhead | Need to implement your own abstraction layer |

### Read More

<div style="background-color: #f6f8fa; padding: 10px; border-radius: 6px;">
<strong>📚 Dive Deeper:</strong>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction">MDN: Introduction to the DOM</a></li>
<li><a href="https://web.dev/articles/dom">web.dev: DOM Manipulation Best Practices</a></li>
</ul>
</div>

## Event Delegation and Bubbling

Event delegation is a technique that leverages event bubbling to handle events at a higher level in the DOM, rather than attaching event listeners to each individual element.

### Historical Context

In the early days of JavaScript interactivity, developers would attach event handlers directly to each element that needed to respond to user input. As applications grew more complex, this created performance issues and memory leaks. Event delegation emerged as a solution by using the natural bubbling behavior of DOM events.

### In Our Application

We use event delegation extensively, particularly for card interactions. Instead of attaching listeners to each card element, we attach listeners to a container and determine which card was interacted with:

```javascript
// Event delegation example
workspace.addEventListener('click', function(event) {
  // Find the closest .card ancestor from the clicked element
  const card = event.target.closest('.card');
  
  if (!card) return; // Click wasn't on a card
  
  // Handle different elements within the card
  if (event.target.matches('.handle')) {
    startDragging(card, event);
  } else if (event.target.matches('.dot')) {
    startConnection(card, event.target, event);
  }
});
```

### Custom Events

For complex interactions, we use custom events to decouple components. This allows different parts of the application to communicate without direct dependencies:

```javascript
// Dispatching a custom event
function notifyCardMoved(cardId, position) {
  const event = new CustomEvent('card:moved', {
    detail: {
      id: cardId,
      position: position
    },
    bubbles: true
  });
  document.dispatchEvent(event);
}

// Listening for the custom event
document.addEventListener('card:moved', function(event) {
  const { id, position } = event.detail;
  updateConnectionsForCard(id, position);
});
```

> ⚠️ Gotcha: When using event delegation, be careful with events that don't naturally bubble (like `focus` and `blur`). You'll need to set the `bubbles: true` option when creating custom events.

### Common Alternatives

| Approach | Description | When to Use |
|----------|-------------|-------------|
| **Direct Event Binding** | Attaching event listeners directly to each element | Small applications with few interactive elements |
| **Reactive Systems** (React) | Declarative event handling through component props | When using component-based architecture |
| **Observer Pattern** | Subscribers register for notifications from a subject | For more complex state management beyond DOM events |

### Pros and Cons

| Pros | Cons |
|------|------|
| Significantly reduced memory usage | Can be harder to reason about for complex event flows |
| Works with dynamically added elements | Not all events bubble naturally |
| Simplified event management | Event path can be difficult to track in large applications |
| Reduced code duplication | Requires understanding of event propagation |

### Read More

<div style="background-color: #f6f8fa; padding: 10px; border-radius: 6px;">
<strong>📚 Dive Deeper:</strong>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events">MDN: Introduction to Events</a></li>
<li><a href="https://javascript.info/event-delegation">JavaScript.info: Event Delegation</a></li>
</ul>
</div>

## State Management Without Frameworks

State management is one of the most challenging aspects of building complex applications. Without a framework providing this functionality, we needed to create a robust system for managing application state.

### Historical Context

Early web applications stored state directly in the DOM, leading to the "DOM as the source of truth" anti-pattern. As applications grew more complex, developers started separating state from the view, leading to various state management patterns. The rise of Flux architecture (2014) and later Redux popularized unidirectional data flow and immutable state.

### In Our Application

We implemented a pub/sub-based state manager that centralizes application state and notifies subscribers of changes:

```javascript
class StateManager {
  constructor(initialState = {}) {
    this._state = initialState;
    this._subscribers = {};
    this._nextId = 1;
  }

  getState(path) {
    if (!path) return { ...this._state };
    
    return path.split('.').reduce((obj, key) => 
      obj && obj[key] !== undefined ? obj[key] : undefined, 
      this._state
    );
  }

  setState(path, value) {
    // Create a new state object with the updated value
    const newState = { ...this._state };
    let current = newState;
    const parts = path.split('.');
    
    // Navigate to the nested property
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      current[key] = { ...current[key] };
      current = current[key];
    }
    
    // Set the value and notify subscribers
    const lastKey = parts[parts.length - 1];
    current[lastKey] = value;
    this._state = newState;
    this._notifySubscribers(path);
  }
  
  subscribe(path, callback) {
    const id = this._nextId++;
    if (!this._subscribers[path]) {
      this._subscribers[path] = {};
    }
    this._subscribers[path][id] = callback;
    return id;
  }
  
  // Additional methods omitted for brevity
}
```

> ℹ️ Tip: Using a dot notation path system (like `cards.1.position.x`) allows for precise updates and subscriptions to deeply nested state without requiring complex immutability libraries.

### Common Alternatives

| Approach | Description | When to Use |
|----------|-------------|-------------|
| **Redux** | Centralized store with reducers and actions | Complex applications with many state transitions |
| **MobX** | Observable state with automatic tracking of dependencies | Applications with complex object relationships |
| **Context API** (React) | Provider/consumer pattern for passing state down | Component trees that need shared state |
| **Local Storage** | Client-side persistence in the browser | When state needs to persist across sessions |

### Pros and Cons

| Pros | Cons |
|------|------|
| Complete control over implementation | More code to write and maintain |
| No dependencies on external libraries | Requires careful design to prevent bugs |
| Can be tailored exactly to your needs | No ecosystem of tools and middleware |
| Performance optimized for your use case | Need to implement your own debugging tools |

### Read More

<div style="background-color: #f6f8fa; padding: 10px; border-radius: 6px;">
<strong>📚 Dive Deeper:</strong>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Proxy">MDN: JavaScript Proxy Objects</a></li>
<li><a href="https://css-tricks.com/build-a-state-management-system-with-vanilla-javascript/">CSS-Tricks: Build a State Management System with Vanilla JavaScript</a></li>
</ul>
</div>

## Model-View-Controller Pattern

The Model-View-Controller (MVC) pattern separates an application into three interconnected components, making the code more maintainable and easier to test.

### Historical Context

MVC originated in the 1970s for desktop software development but became popular for web applications in the early 2000s with frameworks like Ruby on Rails. As JavaScript applications grew more complex, MVC and its variants (MVP, MVVM) became common architectural patterns for organizing front-end code.

### In Our Application

We implement a variation of MVC where:

1. **Models** represent the data structure (cards, connections)
2. **Views** handle rendering to the DOM (DOMRenderer, SVGRenderer)
3. **Controllers** contain business logic and coordinate between models and views

```javascript
// Card model (simplified)
class CardModel {
  constructor(id, position, width, height) {
    this.id = id;
    this.x = position.x;
    this.y = position.y;
    this.width = width || 350;
    this.height = height || 250;
  }
  
  moveTo(x, y) {
    this.x = x;
    this.y = y;
    return { x, y };
  }
}

// Card controller (simplified)
class CardController {
  constructor(stateManager, eventBus, renderer) {
    this.stateManager = stateManager;
    this.eventBus = eventBus;
    this.renderer = renderer;
    
    // Set up event listeners
    this.eventBus.on('card:dragmove', this._handleDragMove.bind(this));
  }
  
  _handleDragMove(data) {
    // Update model in state
    this.stateManager.setState(`cards.${data.id}.x`, data.x);
    this.stateManager.setState(`cards.${data.id}.y`, data.y);
    
    // Update view is handled separately via state subscriptions
  }
}
```

### Common Alternatives

| Approach | Description | When to Use |
|----------|-------------|-------------|
| **Flux/Redux** | Unidirectional data flow with actions and reducers | Complex applications with many state transitions |
| **MVVM** | Two-way data binding between View and ViewModel | Applications with complex forms and data editing |
| **Component-Based** | Encapsulated components with their own state and behavior | Modern web applications with reusable UI elements |

### Pros and Cons

| Pros | Cons |
|------|------|
| Clear separation of concerns | Can feel verbose for simple applications |
| Easier to maintain and test | Requires discipline to maintain boundaries |
| Independent development of components | Potentially more boilerplate code |
| Well-established pattern | Can be overkill for small projects |

### Read More

<div style="background-color: #f6f8fa; padding: 10px; border-radius: 6px;">
<strong>📚 Dive Deeper:</strong>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Glossary/MVC">MDN: MVC</a></li>
<li><a href="https://www.taniarascia.com/javascript-mvc-todo-app/">Building a Simple MVC App in Vanilla JavaScript</a></li>
</ul>
</div>

## The Event Bus Pattern

An event bus acts as a central hub for communication between components, reducing direct dependencies and improving modularity.

### Historical Context

As applications grew more complex, tight coupling between components became problematic. The event bus pattern (sometimes called publish-subscribe or message bus) emerged to allow components to communicate without direct references to each other. This pattern became popular in the early 2010s for modular JavaScript applications.

### In Our Application

We implement a lightweight event bus that components can use to communicate:

```javascript
class EventBus {
  constructor() {
    this._events = {};
  }

  on(event, callback) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    
    this._events[event].push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this._events[event]) return;
    
    this._events[event] = this._events[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this._events[event]) return;
    
    this._events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }
}
```

Usage example:

```javascript
// In card controller
this.eventBus.emit('card:moved', { 
  id: cardId, 
  position: { x, y } 
});

// In connection controller
this.eventBus.on('card:moved', data => {
  this.updateConnectionsForCard(data.id, data.position);
});
```

> ⚠️ Gotcha: Event buses can make debugging harder as the flow of data becomes less explicit. Consider logging events in development to understand the sequence of operations.

### Common Alternatives

| Approach | Description | When to Use |
|----------|-------------|-------------|
| **Direct Method Calls** | Components call methods on each other directly | Small applications with clear component relationships |
| **Redux/Flux** | Centralized state store with actions | Applications with complex state logic |
| **Observer Pattern** | Objects (observers) register with subjects | When you need fine-grained control over notifications |
| **Context API** (React) | Provider/consumer pattern | Component trees that need shared data |

### Pros and Cons

| Pros | Cons |
|------|------|
| Decouples components | Can make debugging more difficult |
| Makes component communication more flexible | Event naming requires careful coordination |
| Simplifies adding new components | Can lead to "event spaghetti" if overused |
| Easier to refactor individual components | Harder to trace the flow of data |

### Read More

<div style="background-color: #f6f8fa; padding: 10px; border-radius: 6px;">
<strong>📚 Dive Deeper:</strong>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/EventTarget">MDN: EventTarget Interface</a></li>
<li><a href="https://medium.com/better-programming/implementing-an-event-bus-in-javascript-93cd07d90477">Implementing an Event Bus in JavaScript</a></li>
</ul>
</div>

## Progressive Enhancement

Progressive enhancement is a strategy for web design that emphasizes core content and functionality first, then progressively adds more complex layers for more capable browsers.

### Historical Context

Progressive enhancement emerged in the mid-2000s as a response to the fragmented browser landscape. Rather than building for the most advanced browsers and attempting to backport (graceful degradation), developers started with a baseline experience and enhanced it where possible. This approach has experienced renewed interest with the rise of mobile devices with varying capabilities.

### In Our Application

We apply progressive enhancement by ensuring our application works at several levels:

1. **Base HTML**: Provides structure and basic content even without CSS or JavaScript
2. **CSS Styling**: Enhances the visual presentation
3. **Core JavaScript**: Adds essential interactivity
4. **Advanced Features**: Implements more complex interactions for capable browsers

For our connection feature, we detect support for SVG before attempting to use it:

```javascript
function setupConnectionSystem() {
  // Check if browser supports SVG
  if (!document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1')) {
    // Provide fallback behavior for connections
    setupConnectionFallback();
    return;
  }
  
  // Create SVG container for connections
  const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgContainer.setAttribute('id', 'connections-svg');
  svgContainer.style.position = 'fixed';
  svgContainer.style.top = '0';
  svgContainer.style.left = '0';
  svgContainer.style.width = '100%';
  svgContainer.style.height = '100%';
  svgContainer.style.pointerEvents = 'none';
  
  document.body.appendChild(svgContainer);
  // Additional setup code...
}
```

> ℹ️ Tip: Design your application to work without JavaScript first, then enhance it. This ensures a baseline experience for all users and creates a more resilient application.

### Common Alternatives

| Approach | Description | When to Use |
|----------|-------------|-------------|
| **Graceful Degradation** | Build for modern browsers, then add fallbacks | When targeting primarily modern browsers |
| **Responsive Design** | Adapt layout based on device capabilities | When focusing primarily on visual adaptations |
| **Feature Detection** | Check for feature support before using it | For specific feature implementations |
| **Polyfills** | Add missing functionality to older browsers | When specific newer APIs are required |

### Pros and Cons

| Pros | Cons |
|------|------|
| Works for the widest possible audience | Requires more planning and development time |
| More resilient to browser limitations | May need multiple implementation approaches |
| Better accessibility | Feature differences between users |
| SEO advantages from base HTML content | Testing across multiple capability levels |

### Read More

<div style="background-color: #f6f8fa; padding: 10px; border-radius: 6px;">
<strong>📚 Dive Deeper:</strong>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement">MDN: Progressive Enhancement</a></li>
<li><a href="https://www.smashingmagazine.com/2009/04/progressive-enhancement-what-it-is-and-how-to-use-it/">Smashing Magazine: What is Progressive Enhancement</a></li>
</ul>
</div>

## Accessibility Considerations

Accessibility ensures that applications work for everyone, including people with disabilities. It's not just a nice-to-have; it's essential for creating inclusive web experiences.

### Historical Context

Web accessibility has evolved from being an afterthought to a fundamental consideration. The Web Content Accessibility Guidelines (WCAG) were first published in 1999, with major updates in 2008 (WCAG 2.0) and 2018 (WCAG 2.1). In many regions, accessibility is now a legal requirement for websites, especially for government and public services.

### In Our Application

We implement accessibility through several approaches:

1. **Semantic HTML**: Using the right elements for their intended purpose
2. **ARIA attributes**: Adding context for assistive technologies
3. **Keyboard navigation**: Ensuring the application is usable without a mouse
4. **Focus management**: Providing clear visual indicators of focused elements

```html
<!-- Accessibility enhancements for our cards -->
<div 
  class="card" 
  role="region" 
  aria-label="Scenario 1" 
  tabindex="0"
  data-scenario="1">
  
  <div class="card-header">
    <div 
      class="handle" 
      role="button" 
      aria-label="Drag scenario card" 
      tabindex="0">
    </div>
    <h2 id="card-1-title">Scenario 1</h2>
  </div>
  
  <div class="card-connectors">
    <div 
      class="dot dot-top" 
      role="button"
      aria-label="Create connection from top" 
      tabindex="0" 
      data-side="0">
    </div>
    <!-- Other dots... -->
  </div>
</div>
```

For keyboard interaction with drag operations:

```javascript
function setupKeyboardDrag(card) {
  card.addEventListener('keydown', function(e) {
    const handle = card.querySelector('.handle');
    
    // Only proceed if the handle element is focused
    if (document.activeElement !== handle) return;
    
    // Move the card with arrow keys
    if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      
      const step = e.shiftKey ? 10 : 1; // Larger steps with shift key
      let x = parseInt(card.style.left) || 0;
      let y = parseInt(card.style.top) || 0;
      
      switch (e.key) {
        case 'ArrowUp': y -= step; break;
        case 'ArrowDown': y += step; break;
        case 'ArrowLeft': x -= step; break;
        case 'ArrowRight': x += step; break;
      }
      
      card.style.left = `${x}px`;
      card.style.top = `${y}px`;
      
      // Notify the application of movement
      notifyCardMoved(card.dataset.scenario, { x, y });
    }
  });
}
```

> ⚠️ Gotcha: Draggable elements often pose accessibility challenges. Always provide keyboard alternatives for drag operations, and ensure appropriate ARIA roles and properties are applied.

### Common Alternatives

| Approach | Description | When to Use |
|----------|-------------|-------------|
| **Framework Components** | Pre-built accessible components | When using component libraries |
| **Accessibility Overlays** | Third-party tools that modify your site | Generally not recommended - better to build accessibility in |
| **Alternative Views** | Separate interfaces for different needs | For very complex visual interfaces |

### Pros and Cons

| Pros | Cons |
|------|------|
| Reaches a wider audience | Requires additional development effort |
| Often legally required | May constrain some visual design choices |
| Improves usability for everyone | Needs ongoing testing and maintenance |
| Better SEO | Learning curve for proper implementation |

### Read More

<div style="background-color: #f6f8fa; padding: 10px; border-radius: 6px;">
<strong>📚 Dive Deeper:</strong>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/Accessibility">MDN: Accessibility</a></li>
<li><a href="https://web.dev/learn/accessibility/">web.dev: Learn Accessibility</a></li>
<li><a href="https://www.w3.org/WAI/standards-guidelines/aria/">W3C: WAI-ARIA Overview</a></li>
</ul>
</div>

## JavaScript Module Patterns

Modules help organize code into separate, reusable pieces with clear boundaries, making applications more maintainable.

### Historical Context

JavaScript lacked native module support until relatively recently. Developers created patterns like Immediately Invoked Function Expressions (IIFEs) and the Revealing Module Pattern to simulate modules. CommonJS (used in Node.js) and AMD (for browsers) emerged as module systems around 2009. ES Modules became a standard in 2015 (ES6) but took several years to gain broad browser support.

### In Our Application

We use native ES Modules to organize our code into logical units:

```javascript
// core/StateManager.js
export default class StateManager {
  constructor(initialState = {}) {
    this._state = initialState;
    this._subscribers = {};
  }
  
  // Methods...
}

// main.js
import StateManager from './core/StateManager.js';
import EventBus from './core/EventBus.js';
import DOMRenderer from './views/DOMRenderer.js';

// Initialize application
function initializeApplication() {
  const stateManager = new StateManager({
    host: localStorage.getItem('host') || 'http://localhost:8080',
    cards: {},
    connections: {}
  });
  
  const eventBus = new EventBus();
  const renderer = new DOMRenderer();
  
  // Additional initialization...
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApplication);
```

> ℹ️ Tip: When using ES Modules, explicitly name your imports and exports to make the codebase more navigable. Avoid excessive use of default exports which can make refactoring harder.

### Common Alternatives

| Approach | Description | When to Use |
|----------|-------------|-------------|
| **IIFE Pattern** | Immediately Invoked Function Expressions for scope | Legacy code or when bundling isn't available |
| **CommonJS** | `require()`/`module.exports` pattern | Node.js environments |
| **AMD** | Asynchronous Module Definition with `define()` | Legacy browser applications |
| **Bundlers** (Webpack, Rollup) | Tools that combine modules | Production applications that need optimization |

### Pros and Cons of ES Modules

| Pros | Cons |
|------|------|
| Native browser support | Requires modern browsers (or transpilation) |
| Static analysis possible | HTTP overhead with many small files |
| Clear dependency structure | Requires CORS considerations on servers |
| Tree-shakable | May need build tools for production optimization |

### Read More

<div style="background-color: #f6f8fa; padding: 10px; border-radius: 6px;">
<strong>📚 Dive Deeper:</strong>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules">MDN: JavaScript Modules</a></li>
<li><a href="https://exploringjs.com/es6/ch_modules.html">Exploring JS: Modules</a></li>
</ul>
</div>

## Build vs. Runtime Composition

How and when your application comes together—at build time or runtime—affects performance, maintainability, and the development experience.

### Historical Context

Early websites assembled pages on the server (build time) and sent complete HTML to browsers. As JavaScript grew more powerful, client-side rendering (runtime composition) became popular, especially with Single Page Applications. By the late 2010s, hybrid approaches emerged to balance performance and interactivity, including server-side rendering with hydration and static site generation with partial hydration.

### In Our Application

We chose a mainly runtime composition approach, where:

1. The initial HTML provides the structure and core UI elements
2. JavaScript loads and initializes components dynamically
3. The application assembles itself in the browser at runtime

This approach gives us flexibility for interactive elements while keeping the initial load lightweight:

```javascript
// Runtime composition of components
function initializeApplication() {
  // Core systems
  const stateManager = new StateManager(initialState);
  const eventBus = new EventBus();
  const domRenderer = new DOMRenderer();
  const svgRenderer = new SVGRenderer();
  
  // Controllers
  const cardController = new CardController(stateManager, eventBus, domRenderer);
  const connectionController = new ConnectionController(
    stateManager, eventBus, domRenderer, svgRenderer
  );
  const layoutController = new LayoutController(
    stateManager, eventBus, domRenderer, cardController, connectionController
  );
  
  // Orchestration
  const appController = new AppController(
    stateManager, eventBus, domRenderer, 
    cardController, connectionController, layoutController
  );
  
  // Start the application
  appController.initializeApplication();
}
```

> ⚠️ Gotcha: Runtime composition can lead to "flash of unstyled content" (FOUC) or layout shifts as the application loads. Consider using loading indicators or skeleton screens to improve perceived performance.

### Common Alternatives

| Approach | Description | When to Use |
|----------|-------------|-------------|
| **Server Rendering** | Generate complete HTML on the server | Content-focused sites that need SEO |
| **Static Generation** | Pre-build pages at deploy time | Content that doesn't change frequently |
| **Islands Architecture** | Static HTML with interactive "islands" | Hybrid approach balancing SEO and interactivity |
| **Edge Rendering** | Generate HTML at CDN edge locations | Personalized content with global distribution |

### Pros and Cons

| Pros | Cons |
|------|------|
| Highly dynamic and interactive | Slower initial render |
| Flexible for complex UIs | Can impact SEO if not implemented carefully |
| Reduces server load | More client-side CPU and memory usage |
| Smoother user experience after initial load | Requires more client-side error handling |

### Read More

<div style="background-color: #f6f8fa; padding: 10px; border-radius: 6px;">
<strong>📚 Dive Deeper:</strong>
<ul>
<li><a href="https://www.patterns.dev/posts/rendering-patterns">Patterns.dev: Rendering Patterns</a></li>
<li><a href="https://web.dev/rendering-on-the-web/">web.dev: Rendering on the Web</a></li>
</ul>
</div>

## Why Choose Vanilla JS

With so many frameworks available, why build with vanilla JavaScript? This section explores the rationale behind our decision and when it makes sense to go framework-free.

### Historical Context

JavaScript frameworks gained popularity as web applications grew more complex, offering structure and solutions to common problems. Angular emerged in 2010, React in 2013, and Vue in 2014. As these frameworks evolved, they became more powerful but also more complex. Around 2020, a movement back toward vanilla JavaScript began gaining momentum, driven by concerns about performance, bundle size, and framework churn.

### Our Reasoning

We chose vanilla JavaScript for several key reasons:

1. **Performance**: No framework overhead means faster load times and execution
2. **Control**: Complete understanding of the entire codebase
3. **Longevity**: No risk of framework abandonment or major breaking changes
4. **Learning**: Deeper understanding of web fundamentals
5. **Browser compatibility**: Works in more browsers without transpilation

When we needed structure, we created our own lightweight abstractions rather than importing entire frameworks. This "just enough structure" approach gave us the benefits of organization without the downsides of external dependencies.

> ℹ️ Tip: Consider vanilla JS when building applications with long maintenance horizons or when performance is a critical requirement. The more specialized your UI needs, the more you might benefit from rolling your own solution.

### Common Alternatives

| Approach | Description | When to Use |
|----------|-------------|-------------|
| **React** | Component-based library with virtual DOM | Complex UI with frequent updates |
| **Vue** | Progressive framework with template-based components | Applications that need to grow incrementally |
| **Angular** | Full-featured framework with extensive tooling | Enterprise applications with large teams |
| **Svelte** | Compiler-based approach with minimal runtime | Performance-critical applications |
| **Web Components** | Browser-native component system | Reusable components for multiple projects |

### Pros and Cons

| Pros | Cons |
|------|------|
| No external dependencies | More boilerplate code |
| Smaller bundle size | Need to solve common problems yourself |
| Complete control | Longer development time |
| Future-proof | Less ecosystem support |
| Educational value | Requires more discipline to maintain structure |

### Read More

<div style="background-color: #f6f8fa; padding: 10px; border-radius: 6px;">
<strong>📚 Dive Deeper:</strong>
<ul>
<li><a href="https://developers.google.com/web/fundamentals">Google Web Fundamentals</a></li>
<li><a href="https://vanillajskit.com/">The Vanilla JS Toolkit</a></li>
<li><a href="https://dev.to/davinmiller/7-reasons-i-still-use-vanilla-js-2cg2">7 Reasons to Use Vanilla JS</a></li>
</ul>
</div>

## Key Takeaways

- **Separation of concerns** through MVC architecture creates maintainable code, even without frameworks
- **Event-driven architecture** with an event bus enables loosely coupled components that can evolve independently
- **Centralized state management** provides a single source of truth, making application behavior more predictable
- **DOM abstraction** isolates direct manipulation, making it easier to refactor and test
- **Progressive enhancement** ensures a baseline experience for all users, then adds features for capable browsers
- **Accessibility by design** makes applications usable by everyone and often leads to better overall UX
- **Module organization** improves code maintainability and reusability without adding runtime overhead
- **Runtime composition** balances flexibility with performance for interactive applications
- **Vanilla JavaScript** provides maximum control and performance at the cost of development speed
- **Custom abstractions** give you the benefits of frameworks without the external dependencies

## Glossary

- **DOM (Document Object Model)**: Browser's representation of HTML elements as a tree structure that can be manipulated with JavaScript
- **Event Delegation**: Pattern where a single event listener on a parent element handles events for multiple child elements
- **Event Bubbling**: Process where an event triggered on a nested element "bubbles up" through its ancestors
- **State Management**: System for managing application data and ensuring UI consistency
- **MVC (Model-View-Controller)**: Architectural pattern that separates an application into three components: data, presentation, and logic
- **Event Bus**: Central hub for communication between components using a publish-subscribe pattern
- **Progressive Enhancement**: Strategy of building with a baseline of essential content and functionality, then adding layers for more capable environments
- **ARIA (Accessible Rich Internet Applications)**: Set of attributes that define ways to make web content more accessible
- **ES Modules**: JavaScript's native module system using `import` and `export` statements
- **Runtime Composition**: Assembling application components in the browser rather than during the build process
- **Virtual DOM**: Lightweight copy of the actual DOM used to calculate the most efficient way to update the real DOM
- **Web Components**: Suite of browser technologies for creating reusable, encapsulated HTML elements

---

This guide has outlined the architectural foundations of our vanilla JavaScript application. While frameworks offer valuable abstractions, understanding these core concepts gives you the flexibility to choose the right tool for each job—whether that's a framework, a library, or plain JavaScript.