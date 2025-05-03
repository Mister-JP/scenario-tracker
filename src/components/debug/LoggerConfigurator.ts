/**
 * Logger Configurator Component
 * 
 * Provides a UI for configuring the logging system.
 * Features:
 * - Toggle global log level
 * - Toggle log levels for specific namespaces
 * - Save/load configurations
 * - Show/hide the configurator panel
 */

import { Logger, LogLevel, LoggerConfig } from "../../utils/Logger.js";
import { createElement } from "../../utils/index.js";

// Known namespaces in the application
// This can be expanded as more components are added
const KNOWN_NAMESPACES = [
  "Card",
  "ConnectorManager",
  "Dialog",
  "Header",
  "GridLayout",
  "Store",
  "App"
];

/**
 * Creates and manages the logger configuration UI
 */
export class LoggerConfigurator {
  /** Root element for the configurator */
  private rootElement: HTMLElement;
  
  /** Whether the configurator is currently visible */
  private isVisible = false;
  
  /** Button to toggle visibility */
  private toggleButton: HTMLButtonElement;

  /**
   * Creates a new logger configurator
   */
  constructor() {
    // Create toggle button in header
    this.toggleButton = createElement<HTMLButtonElement>("button", "debug-toggle");
    this.toggleButton.textContent = "🐞 Debug";
    this.toggleButton.style.marginLeft = "auto";
    this.toggleButton.style.backgroundColor = "#555";
    this.toggleButton.style.position = "absolute";
    this.toggleButton.style.right = "20rem";
    
    const header = document.querySelector("header");
    if (header) {
      header.appendChild(this.toggleButton);
    }
    
    // Create root element for the configurator
    this.rootElement = createElement<HTMLDivElement>("div", "debug-configurator");
    this.rootElement.style.position = "fixed";
    this.rootElement.style.top = "50px";
    this.rootElement.style.right = "10px";
    this.rootElement.style.width = "320px";
    this.rootElement.style.maxHeight = "calc(100vh - 60px)";
    this.rootElement.style.overflow = "auto";
    this.rootElement.style.backgroundColor = "#f5f5f5";
    this.rootElement.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.2)";
    this.rootElement.style.borderRadius = "4px";
    this.rootElement.style.padding = "12px";
    this.rootElement.style.zIndex = "10000";
    this.rootElement.style.display = "none";
    
    document.body.appendChild(this.rootElement);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initialize the UI
    this.renderUI();
  }

  /**
   * Sets up event listeners for the configurator
   */
  private setupEventListeners(): void {
    // Toggle visibility when button is clicked
    this.toggleButton.addEventListener("click", () => {
      this.isVisible = !this.isVisible;
      this.rootElement.style.display = this.isVisible ? "block" : "none";
      this.toggleButton.style.backgroundColor = this.isVisible ? "#666" : "#555";
    });
    
    // Close when clicking outside
    document.addEventListener("click", (event) => {
      if (
        this.isVisible &&
        event.target instanceof Node &&
        !this.rootElement.contains(event.target) &&
        event.target !== this.toggleButton
      ) {
        this.isVisible = false;
        this.rootElement.style.display = "none";
        this.toggleButton.style.backgroundColor = "#555";
      }
    });
    
    // Close on escape key
    document.addEventListener("keydown", (event) => {
      if (this.isVisible && event.key === "Escape") {
        this.isVisible = false;
        this.rootElement.style.display = "none";
        this.toggleButton.style.backgroundColor = "#555";
      }
    });
  }

  /**
   * Renders the configurator UI
   */
  private renderUI(): void {
    // Clear previous content
    this.rootElement.innerHTML = "";
    
    // Create title
    const title = createElement<HTMLHeadingElement>("h2");
    title.textContent = "Debug Logger Configuration";
    title.style.margin = "0 0 12px 0";
    title.style.fontSize = "16px";
    title.style.fontWeight = "500";
    this.rootElement.appendChild(title);
    
    // Create global config section
    this.createGlobalConfigSection();
    
    // Create namespace config section
    this.createNamespaceConfigSection();
    
    // Create actions section
    this.createActionsSection();
  }

  /**
   * Creates the global configuration section
   */
  private createGlobalConfigSection(): void {
    const config = Logger.getConfig();
    
    // Create section
    const section = createElement<HTMLDivElement>("div", "config-section");
    section.style.marginBottom = "16px";
    section.style.padding = "12px";
    section.style.backgroundColor = "#fff";
    section.style.borderRadius = "4px";
    section.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
    
    // Create section title
    const sectionTitle = createElement<HTMLHeadingElement>("h3");
    sectionTitle.textContent = "Global Settings";
    sectionTitle.style.margin = "0 0 8px 0";
    sectionTitle.style.fontSize = "14px";
    sectionTitle.style.fontWeight = "500";
    section.appendChild(sectionTitle);
    
    // Create global log level select
    const levelContainer = createElement<HTMLDivElement>("div", "config-item");
    levelContainer.style.display = "flex";
    levelContainer.style.alignItems = "center";
    levelContainer.style.marginBottom = "8px";
    
    const levelLabel = createElement<HTMLLabelElement>("label");
    levelLabel.textContent = "Global Log Level: ";
    levelLabel.style.marginRight = "8px";
    levelContainer.appendChild(levelLabel);
    
    const levelSelect = createElement<HTMLSelectElement>("select");
    for (let level = LogLevel.DEBUG; level <= LogLevel.NONE; level++) {
      const option = createElement<HTMLOptionElement>("option");
      option.value = level.toString();
      option.textContent = LogLevel[level];
      option.selected = level === config.globalLevel;
      levelSelect.appendChild(option);
    }
    
    levelSelect.addEventListener("change", () => {
      const level = parseInt(levelSelect.value, 10) as LogLevel;
      Logger.setGlobalLevel(level);
      this.renderUI(); // Refresh UI
    });
    
    levelContainer.appendChild(levelSelect);
    section.appendChild(levelContainer);
    
    // Create display options
    const displayContainer = createElement<HTMLDivElement>("div", "config-item");
    displayContainer.style.display = "flex";
    displayContainer.style.flexDirection = "column";
    displayContainer.style.gap = "4px";
    
    // Timestamps checkbox
    const timestampContainer = createElement<HTMLDivElement>("div");
    timestampContainer.style.display = "flex";
    timestampContainer.style.alignItems = "center";
    
    const timestampCheckbox = createElement<HTMLInputElement>("input", "", {
      type: "checkbox"
    });
    timestampCheckbox.checked = config.showTimestamps;
    timestampCheckbox.addEventListener("change", () => {
      Logger.updateConfig({ showTimestamps: timestampCheckbox.checked });
    });
    
    const timestampLabel = createElement<HTMLLabelElement>("label");
    timestampLabel.textContent = "Show Timestamps";
    timestampLabel.style.marginLeft = "4px";
    
    timestampContainer.appendChild(timestampCheckbox);
    timestampContainer.appendChild(timestampLabel);
    displayContainer.appendChild(timestampContainer);
    
    // Namespace checkbox
    const namespaceContainer = createElement<HTMLDivElement>("div");
    namespaceContainer.style.display = "flex";
    namespaceContainer.style.alignItems = "center";
    
    const namespaceCheckbox = createElement<HTMLInputElement>("input", "", {
      type: "checkbox"
    });
    namespaceCheckbox.checked = config.showNamespace;
    namespaceCheckbox.addEventListener("change", () => {
      Logger.updateConfig({ showNamespace: namespaceCheckbox.checked });
    });
    
    const namespaceLabel = createElement<HTMLLabelElement>("label");
    namespaceLabel.textContent = "Show Namespace";
    namespaceLabel.style.marginLeft = "4px";
    
    namespaceContainer.appendChild(namespaceCheckbox);
    namespaceContainer.appendChild(namespaceLabel);
    displayContainer.appendChild(namespaceContainer);
    
    section.appendChild(displayContainer);
    this.rootElement.appendChild(section);
  }

  /**
   * Creates the namespace configuration section
   */
  private createNamespaceConfigSection(): void {
    const config = Logger.getConfig();
    
    // Create section
    const section = createElement<HTMLDivElement>("div", "config-section");
    section.style.marginBottom = "16px";
    section.style.padding = "12px";
    section.style.backgroundColor = "#fff";
    section.style.borderRadius = "4px";
    section.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
    
    // Create section title
    const sectionTitle = createElement<HTMLHeadingElement>("h3");
    sectionTitle.textContent = "Namespace Settings";
    sectionTitle.style.margin = "0 0 8px 0";
    sectionTitle.style.fontSize = "14px";
    sectionTitle.style.fontWeight = "500";
    section.appendChild(sectionTitle);
    
    // Create namespace list
    const namespaceList = createElement<HTMLDivElement>("div", "namespace-list");
    namespaceList.style.display = "grid";
    namespaceList.style.gridTemplateColumns = "1fr 1fr";
    namespaceList.style.gap = "8px";
    
    // Add namespace entries
    KNOWN_NAMESPACES.forEach((namespace) => {
      const namespaceEntry = createElement<HTMLDivElement>("div", "namespace-entry");
      namespaceEntry.style.display = "flex";
      namespaceEntry.style.alignItems = "center";
      namespaceEntry.style.padding = "4px";
      namespaceEntry.style.backgroundColor = "#f5f5f5";
      namespaceEntry.style.borderRadius = "4px";
      
      const nameLabel = createElement<HTMLSpanElement>("span");
      nameLabel.textContent = namespace;
      nameLabel.style.marginRight = "8px";
      nameLabel.style.overflow = "hidden";
      nameLabel.style.textOverflow = "ellipsis";
      namespaceEntry.appendChild(nameLabel);
      
      const levelSelect = createElement<HTMLSelectElement>("select");
      levelSelect.style.marginLeft = "auto";
      levelSelect.style.fontSize = "12px";
      
      for (let level = LogLevel.DEBUG; level <= LogLevel.NONE; level++) {
        const option = createElement<HTMLOptionElement>("option");
        option.value = level.toString();
        option.textContent = LogLevel[level].substring(0, 1); // Just use first letter to save space
        option.title = LogLevel[level]; // Full name as tooltip
        
        // Determine if this option should be selected
        const namespaceLevel = config.namespaceLevels[namespace];
        option.selected = 
          namespaceLevel !== undefined && level === namespaceLevel;
        
        levelSelect.appendChild(option);
      }
      
      // Add default option (inherit from global)
      const defaultOption = createElement<HTMLOptionElement>("option");
      defaultOption.value = "-1";
      defaultOption.textContent = "G"; // G for global
      defaultOption.title = "Inherit from global";
      defaultOption.selected = config.namespaceLevels[namespace] === undefined;
      levelSelect.prepend(defaultOption);
      
      levelSelect.addEventListener("change", () => {
        const level = parseInt(levelSelect.value, 10);
        if (level === -1) {
          // Use global level
          Logger.resetNamespaceLevel(namespace);
        } else {
          // Use specific level
          Logger.setNamespaceLevel(namespace, level as LogLevel);
        }
      });
      
      namespaceEntry.appendChild(levelSelect);
      namespaceList.appendChild(namespaceEntry);
    });
    
    section.appendChild(namespaceList);
    this.rootElement.appendChild(section);
  }

  /**
   * Creates the actions section
   */
  private createActionsSection(): void {
    // Create section
    const section = createElement<HTMLDivElement>("div", "config-section");
    section.style.display = "flex";
    section.style.justifyContent = "space-between";
    
    // Create reset button
    const resetButton = createElement<HTMLButtonElement>("button");
    resetButton.textContent = "Reset to Defaults";
    resetButton.style.padding = "6px 12px";
    resetButton.style.border = "1px solid #ccc";
    resetButton.style.borderRadius = "4px";
    resetButton.style.backgroundColor = "#f1f1f1";
    resetButton.style.cursor = "pointer";
    
    resetButton.addEventListener("click", () => {
      if (confirm("Reset logger configuration to defaults?")) {
        Logger.resetConfig();
        this.renderUI();
      }
    });
    
    // Create enable all debug button
    const enableAllButton = createElement<HTMLButtonElement>("button");
    enableAllButton.textContent = "Enable All Debug";
    enableAllButton.style.padding = "6px 12px";
    enableAllButton.style.border = "1px solid #ccc";
    enableAllButton.style.borderRadius = "4px";
    enableAllButton.style.backgroundColor = "#e3f2fd";
    enableAllButton.style.cursor = "pointer";
    
    enableAllButton.addEventListener("click", () => {
      Logger.setGlobalLevel(LogLevel.DEBUG);
      this.renderUI();
    });
    
    section.appendChild(resetButton);
    section.appendChild(enableAllButton);
    this.rootElement.appendChild(section);
  }
}

/**
 * Initializes the logger configurator
 * Should be called after the header is created
 */
export function initLoggerConfigurator(): void {
  new LoggerConfigurator();
}