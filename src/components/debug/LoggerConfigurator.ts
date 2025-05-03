/**
 * Logger Configurator Component
 * 
 * Provides an enhanced UI for configuring the logging system.
 * Matches the styling of the arrow editor dialog.
 * 
 * Features:
 * - Toggle global log level
 * - Toggle log levels for specific namespaces
 * - Filter namespaces with pattern
 * - View and export log history
 * - Performance monitoring
 * - Customizable display options
 */

import { Logger, LogLevel, LoggerConfig, LogEntry } from "../../utils/Logger.js";
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
  
  /** Modal overlay for proper styling */
  private modalOverlay: HTMLElement;
  
  /** Whether the configurator is currently visible */
  private isVisible = false;
  
  /** Button to toggle visibility */
  private toggleButton: HTMLButtonElement;

  /** Tab buttons for the UI */
  private tabButtons: Record<string, HTMLButtonElement> = {};

  /** Content sections for each tab */
  private tabContents: Record<string, HTMLElement> = {};

  /** Currently active tab */
  private activeTab = 'settings';

  /** Timer for log history refresh */
  private refreshTimer: number | null = null;

  /**
   * Creates a new logger configurator
   */
  constructor() {
    // Create toggle button in header
    this.toggleButton = createElement<HTMLButtonElement>("button", "debug-toggle");
    this.toggleButton.textContent = "🐞 Debug";
    this.toggleButton.style.position = "absolute";
    this.toggleButton.style.right = "20rem";
    
    const header = document.querySelector("header");
    if (header) {
      header.appendChild(this.toggleButton);
    }
    
    // Create modal overlay (background)
    this.modalOverlay = createElement<HTMLDivElement>("div", "modal-overlay debug-modal-overlay");
    this.modalOverlay.style.position = "fixed";
    this.modalOverlay.style.top = "0";
    this.modalOverlay.style.left = "0";
    this.modalOverlay.style.right = "0";
    this.modalOverlay.style.bottom = "0";
    this.modalOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    this.modalOverlay.style.display = "none";
    this.modalOverlay.style.alignItems = "center";
    this.modalOverlay.style.justifyContent = "center";
    this.modalOverlay.style.zIndex = "10000";
    document.body.appendChild(this.modalOverlay);
    
    // Create root element for the configurator
    this.rootElement = createElement<HTMLDivElement>("div", "debug-configurator");
    this.rootElement.style.width = "700px";
    this.rootElement.style.maxWidth = "90%";
    this.rootElement.style.maxHeight = "80vh";
    this.rootElement.style.backgroundColor = "#fff";
    this.rootElement.style.borderRadius = "8px";
    this.rootElement.style.boxShadow = "0 5px 25px rgba(0, 0, 0, 0.3)";
    this.rootElement.style.overflow = "hidden";
    this.rootElement.style.display = "flex";
    this.rootElement.style.flexDirection = "column";
    this.modalOverlay.appendChild(this.rootElement);
    
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
      this.toggleVisibility();
    });
    
    // Close when clicking outside
    this.modalOverlay.addEventListener("click", (event) => {
      if (event.target === this.modalOverlay) {
        this.hide();
      }
    });
    
    // Close on escape key
    document.addEventListener("keydown", (event) => {
      if (this.isVisible && event.key === "Escape") {
        this.hide();
      }
    });
  }

  /**
   * Shows the configurator
   */
  private show(): void {
    this.isVisible = true;
    this.modalOverlay.style.display = "flex";
    this.toggleButton.style.backgroundColor = "#666";
    
    // Start auto-refresh of logs if on logs tab
    if (this.activeTab === 'logs') {
      this.startLogRefresh();
    }
  }

  /**
   * Hides the configurator
   */
  private hide(): void {
    this.isVisible = false;
    this.modalOverlay.style.display = "none";
    this.toggleButton.style.backgroundColor = "";
    
    // Stop auto-refresh of logs
    this.stopLogRefresh();
  }

  /**
   * Toggles visibility of the configurator
   */
  private toggleVisibility(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Starts automatic refresh of log history
   */
  private startLogRefresh(): void {
    // Clear any existing timer
    this.stopLogRefresh();
    
    // Set up new timer
    this.refreshTimer = window.setInterval(() => {
      this.refreshLogHistory();
    }, 2000); // Refresh every 2 seconds
  }

  /**
   * Stops automatic refresh of log history
   */
  private stopLogRefresh(): void {
    if (this.refreshTimer !== null) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Renders the configurator UI
   */
  private renderUI(): void {
    // Clear previous content
    this.rootElement.innerHTML = "";
    
    // Create header
    this.createHeader();
    
    // Create tabs
    this.createTabs();
    
    // Create tab contents
    this.createSettingsTab();
    this.createNamespacesTab();
    this.createLogsTab();
    this.createPerformanceTab();
    
    // Show the active tab
    this.showTab(this.activeTab);
  }

  /**
   * Creates the header section
   */
  private createHeader(): void {
    const header = createElement<HTMLDivElement>("div", "modal-header");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.padding = "12px 16px";
    header.style.borderBottom = "1px solid #eee";
    header.style.background = "#f5f5f5";
    header.style.borderRadius = "8px 8px 0 0";
    
    // Close button
    const closeButton = createElement<HTMLDivElement>("div", "modal-close");
    closeButton.innerHTML = "×"; // X symbol
    closeButton.style.width = "16px";
    closeButton.style.height = "16px";
    closeButton.style.borderRadius = "50%";
    closeButton.style.background = "#ff5f57";
    closeButton.style.color = "rgba(0, 0, 0, 0.5)";
    closeButton.style.display = "flex";
    closeButton.style.alignItems = "center";
    closeButton.style.justifyContent = "center";
    closeButton.style.fontSize = "12px";
    closeButton.style.fontWeight = "bold";
    closeButton.style.cursor = "pointer";
    closeButton.style.marginRight = "8px";
    closeButton.addEventListener("click", () => this.hide());
    header.appendChild(closeButton);
    
    // Title
    const title = createElement<HTMLHeadingElement>("h2");
    title.textContent = "Debug Tools";
    title.style.margin = "0";
    title.style.fontSize = "16px";
    title.style.fontWeight = "500";
    title.style.flex = "1";
    header.appendChild(title);
    
    this.rootElement.appendChild(header);
  }

  /**
   * Creates the tab navigation
   */
  private createTabs(): void {
    const tabBar = createElement<HTMLDivElement>("div", "tab-bar");
    tabBar.style.display = "flex";
    tabBar.style.borderBottom = "1px solid #eee";
    tabBar.style.background = "#f5f5f5";
    
    // Define tabs
    const tabs = [
      { id: 'settings', label: '⚙️ Settings' },
      { id: 'namespaces', label: '🏷️ Namespaces' },
      { id: 'logs', label: '📋 Logs' },
      { id: 'performance', label: '⏱️ Performance' }
    ];
    
    // Create tab buttons
    tabs.forEach(tab => {
      const button = createElement<HTMLButtonElement>("button", "tab-button");
      button.textContent = tab.label;
      button.style.padding = "10px 16px";
      button.style.border = "none";
      button.style.background = "transparent";
      button.style.cursor = "pointer";
      button.style.fontSize = "14px";
      button.style.fontWeight = "500";
      button.style.opacity = "0.7";
      button.style.transition = "opacity 0.2s, border-bottom 0.2s";
      
      button.addEventListener("click", () => {
        this.showTab(tab.id);
        
        // Start/stop log refresh as needed
        if (tab.id === 'logs') {
          this.startLogRefresh();
        } else {
          this.stopLogRefresh();
        }
      });
      
      this.tabButtons[tab.id] = button;
      tabBar.appendChild(button);
    });
    
    this.rootElement.appendChild(tabBar);
  }

  /**
   * Shows a specific tab and hides others
   * @param tabId - ID of the tab to show
   */
  private showTab(tabId: string): void {
    this.activeTab = tabId;
    
    // Update button styles
    Object.entries(this.tabButtons).forEach(([id, button]) => {
      if (id === tabId) {
        button.style.opacity = "1";
        button.style.borderBottom = "2px solid #4285f4";
      } else {
        button.style.opacity = "0.7";
        button.style.borderBottom = "none";
      }
    });
    
    // Show/hide content sections
    Object.entries(this.tabContents).forEach(([id, content]) => {
      content.style.display = id === tabId ? "block" : "none";
    });
    
    // Refresh log history if showing logs tab
    if (tabId === 'logs') {
      this.refreshLogHistory();
    }
  }

  /**
   * Creates the settings tab content
   */
  private createSettingsTab(): void {
    const config = Logger.getConfig();
    
    // Create tab content container
    const content = createElement<HTMLDivElement>("div", "tab-content");
    content.style.padding = "16px";
    content.style.overflow = "auto";
    content.style.maxHeight = "calc(80vh - 120px)";
    
    // Global Settings Section
    const globalSection = this.createSection("Global Settings");
    
    // Global log level dropdown
    const levelContainer = this.createControlGroup("Global Log Level:");
    
    const levelSelect = createElement<HTMLSelectElement>("select");
    levelSelect.style.padding = "6px 8px";
    levelSelect.style.border = "1px solid #ccc";
    levelSelect.style.borderRadius = "4px";
    levelSelect.style.fontSize = "14px";
    
    for (let level = LogLevel.TRACE; level <= LogLevel.NONE; level++) {
      const option = createElement<HTMLOptionElement>("option");
      option.value = level.toString();
      option.textContent = LogLevel[level];
      option.selected = level === config.globalLevel;
      levelSelect.appendChild(option);
    }
    
    levelSelect.addEventListener("change", () => {
      const level = parseInt(levelSelect.value, 10) as LogLevel;
      Logger.setGlobalLevel(level);
    });
    
    levelContainer.appendChild(levelSelect);
    globalSection.appendChild(levelContainer);
    
    // Display Options Section
    const displaySection = this.createSection("Display Options");
    
    // Timestamps checkbox
    const timestampContainer = this.createCheckboxControl(
      "Show Timestamps",
      config.showTimestamps,
      (checked) => {
        Logger.updateConfig({ showTimestamps: checked });
      }
    );
    displaySection.appendChild(timestampContainer);
    
    // Namespace checkbox
    const namespaceContainer = this.createCheckboxControl(
      "Show Namespace",
      config.showNamespace,
      (checked) => {
        Logger.updateConfig({ showNamespace: checked });
      }
    );
    displaySection.appendChild(namespaceContainer);
    
    // Bucketing checkbox
    const bucketingContainer = this.createCheckboxControl(
      "Enable Log Bucketing (group repeated messages)",
      config.enableBucketing !== false,
      (checked) => {
        Logger.updateConfig({ enableBucketing: checked });
      }
    );
    displaySection.appendChild(bucketingContainer);
    
    // Advanced Settings Section
    const advancedSection = this.createSection("Advanced Settings");
    
    // Max log entries
    const maxLogsContainer = this.createControlGroup("Max Log History Size:");
    
    const maxLogsInput = createElement<HTMLInputElement>("input", "", {
      type: "number",
      min: "100",
      max: "10000",
      step: "100"
    });
    maxLogsInput.value = String(config.maxLogEntries || 1000);
    maxLogsInput.style.padding = "6px 8px";
    maxLogsInput.style.border = "1px solid #ccc";
    maxLogsInput.style.borderRadius = "4px";
    maxLogsInput.style.width = "100px";
    
    maxLogsInput.addEventListener("change", () => {
      const value = parseInt(maxLogsInput.value, 10);
      if (!isNaN(value) && value >= 100) {
        Logger.updateConfig({ maxLogEntries: value });
      }
    });
    
    maxLogsContainer.appendChild(maxLogsInput);
    advancedSection.appendChild(maxLogsContainer);
    
    // Actions Section
    const actionsSection = this.createSection("Actions");
    actionsSection.style.display = "flex";
    actionsSection.style.gap = "10px";
    actionsSection.style.justifyContent = "space-between";
    
    // Reset button
    const resetButton = this.createButton("Reset to Defaults", "#f1f1f1");
    resetButton.addEventListener("click", () => {
      if (confirm("Reset logger configuration to defaults?")) {
        Logger.resetConfig();
        this.renderUI();
      }
    });
    actionsSection.appendChild(resetButton);
    
    // Enable all debug button
    const enableAllButton = this.createButton("Enable All Debug", "#e3f2fd");
    enableAllButton.addEventListener("click", () => {
      Logger.setGlobalLevel(LogLevel.DEBUG);
      this.renderUI();
    });
    actionsSection.appendChild(enableAllButton);
    
    // Clear logs button
    const clearLogsButton = this.createButton("Clear Log History", "#ffe0e0");
    clearLogsButton.addEventListener("click", () => {
      if (confirm("Clear all log history?")) {
        Logger.clearLogHistory();
      }
    });
    actionsSection.appendChild(clearLogsButton);
    
    // Add all sections to content
    content.appendChild(globalSection);
    content.appendChild(displaySection);
    content.appendChild(advancedSection);
    content.appendChild(actionsSection);
    
    // Add to root and store reference
    this.rootElement.appendChild(content);
    this.tabContents['settings'] = content;
  }

  /**
   * Creates the namespaces tab content
   */
  private createNamespacesTab(): void {
    const config = Logger.getConfig();
    
    // Create tab content container
    const content = createElement<HTMLDivElement>("div", "tab-content");
    content.style.padding = "16px";
    content.style.overflow = "auto";
    content.style.maxHeight = "calc(80vh - 120px)";
    
    // Filter section
    const filterSection = this.createSection("Namespace Filter");
    
    const filterDescription = createElement<HTMLParagraphElement>("p");
    filterDescription.textContent = "Enter a regex pattern to filter namespaces. Only matching namespaces will be logged.";
    filterDescription.style.fontSize = "14px";
    filterDescription.style.margin = "0 0 12px 0";
    filterSection.appendChild(filterDescription);
    
    const filterInput = createElement<HTMLInputElement>("input", "", {
      type: "text",
      placeholder: "e.g.: ^(Card|Connector)"
    });
    filterInput.value = config.namespaceFilter || "";
    filterInput.style.width = "100%";
    filterInput.style.padding = "8px";
    filterInput.style.border = "1px solid #ccc";
    filterInput.style.borderRadius = "4px";
    filterInput.style.fontSize = "14px";
    filterInput.style.marginBottom = "8px";
    
    const applyButton = this.createButton("Apply Filter", "#4285f4");
    applyButton.style.color = "white";
    applyButton.style.marginBottom = "16px";
    
    applyButton.addEventListener("click", () => {
      const pattern = filterInput.value.trim() || undefined;
      Logger.setNamespaceFilter(pattern);
    });
    
    filterSection.appendChild(filterInput);
    filterSection.appendChild(applyButton);
    
    // Namespace Levels Section
    const namespacesSection = this.createSection("Namespace Log Levels");
    
    const namespaceDescription = createElement<HTMLParagraphElement>("p");
    namespaceDescription.textContent = "Configure log levels for specific namespaces. These override the global level.";
    namespaceDescription.style.fontSize = "14px";
    namespaceDescription.style.margin = "0 0 12px 0";
    namespacesSection.appendChild(namespaceDescription);
    
    // Create namespace grid
    const namespaceGrid = createElement<HTMLDivElement>("div", "namespace-grid");
    namespaceGrid.style.display = "grid";
    namespaceGrid.style.gridTemplateColumns = "repeat(auto-fill, minmax(200px, 1fr))";
    namespaceGrid.style.gap = "10px";
    
    // Header row
    const headerRow = createElement<HTMLDivElement>("div", "namespace-header-row");
    headerRow.style.display = "grid";
    headerRow.style.gridTemplateColumns = "1fr auto";
    headerRow.style.fontWeight = "bold";
    headerRow.style.padding = "6px 0";
    headerRow.style.borderBottom = "1px solid #eee";
    headerRow.style.marginBottom = "6px";
    
    const nameHeader = createElement<HTMLDivElement>("div");
    nameHeader.textContent = "Namespace";
    
    const levelHeader = createElement<HTMLDivElement>("div");
    levelHeader.textContent = "Level";
    
    headerRow.appendChild(nameHeader);
    headerRow.appendChild(levelHeader);
    namespacesSection.appendChild(headerRow);
    
    // Add namespace entries
    KNOWN_NAMESPACES.forEach((namespace) => {
      const namespaceEntry = createElement<HTMLDivElement>("div", "namespace-entry");
      namespaceEntry.style.display = "flex";
      namespaceEntry.style.alignItems = "center";
      namespaceEntry.style.padding = "6px 10px";
      namespaceEntry.style.backgroundColor = "#f7f7f7";
      namespaceEntry.style.borderRadius = "4px";
      namespaceEntry.style.marginBottom = "6px";
      
      const nameLabel = createElement<HTMLSpanElement>("span");
      nameLabel.textContent = namespace;
      nameLabel.style.flex = "1";
      nameLabel.style.overflow = "hidden";
      nameLabel.style.textOverflow = "ellipsis";
      nameLabel.style.whiteSpace = "nowrap";
      namespaceEntry.appendChild(nameLabel);
      
      const levelSelect = createElement<HTMLSelectElement>("select");
      levelSelect.style.padding = "4px 6px";
      levelSelect.style.border = "1px solid #ccc";
      levelSelect.style.borderRadius = "4px";
      levelSelect.style.fontSize = "13px";
      
      for (let level = LogLevel.TRACE; level <= LogLevel.NONE; level++) {
        const option = createElement<HTMLOptionElement>("option");
        option.value = level.toString();
        option.textContent = LogLevel[level];
        
        // Determine if this option should be selected
        const namespaceLevel = config.namespaceLevels[namespace];
        option.selected = 
          namespaceLevel !== undefined && level === namespaceLevel;
        
        levelSelect.appendChild(option);
      }
      
      // Add default option (inherit from global)
      const defaultOption = createElement<HTMLOptionElement>("option");
      defaultOption.value = "-1";
      defaultOption.textContent = "Global";
      defaultOption.selected = config.namespaceLevels[namespace] === undefined;
      levelSelect.insertBefore(defaultOption, levelSelect.firstChild);
      
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
      namespaceGrid.appendChild(namespaceEntry);
    });
    
    namespacesSection.appendChild(namespaceGrid);
    
    // Add custom namespace section
    const customSection = this.createSection("Add Custom Namespace");
    
    const customNameInput = createElement<HTMLInputElement>("input", "", {
      type: "text",
      placeholder: "Custom namespace"
    });
    customNameInput.style.width = "70%";
    customNameInput.style.padding = "8px";
    customNameInput.style.border = "1px solid #ccc";
    customNameInput.style.borderRadius = "4px";
    customNameInput.style.fontSize = "14px";
    customNameInput.style.marginRight = "10px";
    
    const addButton = this.createButton("Add", "#4285f4");
    addButton.style.color = "white";
    addButton.style.width = "20%";
    
    addButton.addEventListener("click", () => {
      const namespace = customNameInput.value.trim();
      if (namespace) {
        // Add to known namespaces if not already included
        if (!KNOWN_NAMESPACES.includes(namespace)) {
          KNOWN_NAMESPACES.push(namespace);
          customNameInput.value = "";
          this.renderUI();
        }
      }
    });
    
    customSection.appendChild(customNameInput);
    customSection.appendChild(addButton);
    
    // Add all sections to content
    content.appendChild(filterSection);
    content.appendChild(namespacesSection);
    content.appendChild(customSection);
    
    // Add to root and store reference
    this.rootElement.appendChild(content);
    this.tabContents['namespaces'] = content;
  }

  /**
   * Creates the logs tab content
   */
  private createLogsTab(): void {
    // Create tab content container
    const content = createElement<HTMLDivElement>("div", "tab-content");
    content.style.padding = "16px";
    content.style.display = "flex";
    content.style.flexDirection = "column";
    content.style.height = "calc(80vh - 120px)";
    
    // Controls section
    const controlsSection = createElement<HTMLDivElement>("div", "logs-controls");
    controlsSection.style.marginBottom = "10px";
    controlsSection.style.display = "flex";
    controlsSection.style.justifyContent = "space-between";
    
    // Level filter
    const levelFilterContainer = createElement<HTMLDivElement>("div");
    levelFilterContainer.style.display = "flex";
    levelFilterContainer.style.alignItems = "center";
    
    const levelFilterLabel = createElement<HTMLLabelElement>("label");
    levelFilterLabel.textContent = "Minimum Level:";
    levelFilterLabel.style.marginRight = "8px";
    levelFilterContainer.appendChild(levelFilterLabel);
    
    const levelFilter = createElement<HTMLSelectElement>("select", "log-level-filter");
    for (let level = LogLevel.TRACE; level <= LogLevel.ERROR; level++) {
      const option = createElement<HTMLOptionElement>("option");
      option.value = level.toString();
      option.textContent = LogLevel[level];
      option.selected = level === LogLevel.TRACE; // Default to showing all
      levelFilter.appendChild(option);
    }
    
    levelFilter.addEventListener("change", () => {
      this.refreshLogHistory();
    });
    
    levelFilterContainer.appendChild(levelFilter);
    controlsSection.appendChild(levelFilterContainer);
    
    // Text filter
    const textFilterContainer = createElement<HTMLDivElement>("div");
    textFilterContainer.style.display = "flex";
    textFilterContainer.style.alignItems = "center";
    textFilterContainer.style.flex = "1";
    textFilterContainer.style.margin = "0 10px";
    
    const textFilterLabel = createElement<HTMLLabelElement>("label");
    textFilterLabel.textContent = "Filter:";
    textFilterLabel.style.marginRight = "8px";
    textFilterContainer.appendChild(textFilterLabel);
    
    const textFilter = createElement<HTMLInputElement>("input", "log-text-filter", {
      type: "text",
      placeholder: "Filter logs by text"
    });
    textFilter.style.flex = "1";
    textFilter.style.padding = "6px 8px";
    textFilter.style.border = "1px solid #ccc";
    textFilter.style.borderRadius = "4px";
    
    textFilter.addEventListener("input", () => {
      this.refreshLogHistory();
    });
    
    textFilterContainer.appendChild(textFilter);
    controlsSection.appendChild(textFilterContainer);
    
    // Actions
    const actionsContainer = createElement<HTMLDivElement>("div");
    actionsContainer.style.display = "flex";
    actionsContainer.style.gap = "8px";
    
    const clearButton = this.createButton("Clear", "#ffe0e0");
    clearButton.addEventListener("click", () => {
      Logger.clearLogHistory();
      this.refreshLogHistory();
    });
    
    const exportButton = this.createButton("Export", "#e3f2fd");
    exportButton.addEventListener("click", () => {
      Logger.downloadLogHistory('text');
    });
    
    actionsContainer.appendChild(clearButton);
    actionsContainer.appendChild(exportButton);
    controlsSection.appendChild(actionsContainer);
    
    // Log display area
    const logDisplayContainer = createElement<HTMLDivElement>("div", "log-display-container");
    logDisplayContainer.style.flex = "1";
    logDisplayContainer.style.overflow = "auto";
    logDisplayContainer.style.border = "1px solid #ddd";
    logDisplayContainer.style.borderRadius = "4px";
    logDisplayContainer.style.backgroundColor = "#f9f9f9";
    logDisplayContainer.style.fontFamily = "monospace";
    logDisplayContainer.style.fontSize = "13px";
    logDisplayContainer.style.whiteSpace = "pre-wrap";
    logDisplayContainer.style.padding = "10px";
    // Add a fixed height to ensure scrolling happens within this container
    logDisplayContainer.style.height = "calc(65vh - 120px)";
    
    // Create log content div
    const logContent = createElement<HTMLDivElement>("div", "log-content");
    logDisplayContainer.appendChild(logContent);
    
    // Status bar
    const statusBar = createElement<HTMLDivElement>("div", "log-status-bar");
    statusBar.style.marginTop = "10px";
    statusBar.style.fontSize = "12px";
    statusBar.style.color = "#666";
    statusBar.textContent = "0 logs displayed";
    
    // Add elements to content
    content.appendChild(controlsSection);
    content.appendChild(logDisplayContainer);
    content.appendChild(statusBar);
    
    // Add to root and store reference
    this.rootElement.appendChild(content);
    this.tabContents['logs'] = content;
  }

  /**
   * Refreshes the log history display
   */
  private refreshLogHistory(): void {
    if (!this.isVisible || this.activeTab !== 'logs') return;
    
    const logContent = this.rootElement.querySelector('.log-content');
    const statusBar = this.rootElement.querySelector('.log-status-bar');
    
    if (!logContent || !statusBar) return;
    
    // Get filter values
    const levelFilter = this.rootElement.querySelector('.log-level-filter') as HTMLSelectElement;
    const textFilter = this.rootElement.querySelector('.log-text-filter') as HTMLInputElement;
    
    const minLevel = parseInt(levelFilter?.value || '0', 10) as LogLevel;
    const textQuery = textFilter?.value.toLowerCase() || '';
    
    // Get logs
    const logs = Logger.getLogHistory();
    
    // Filter logs
    const filteredLogs = logs.filter(log => 
      log.level >= minLevel && 
      (textQuery === '' || 
       log.message.toLowerCase().includes(textQuery) || 
       log.namespace.toLowerCase().includes(textQuery))
    );
    
    // Format logs
    logContent.innerHTML = '';
    
    filteredLogs.forEach(log => {
      const logLine = createElement<HTMLDivElement>("div", `log-line level-${LogLevel[log.level].toLowerCase()}`);
      
      // Format timestamp
      const time = log.timestamp.toISOString().substring(11, 23); // HH:MM:SS.mmm
      
      // Format level with color
      const levelColors: Record<LogLevel, string> = {
        [LogLevel.TRACE]: '#B39DDB',
        [LogLevel.DEBUG]: '#7986CB',
        [LogLevel.INFO]: '#66BB6A',
        [LogLevel.WARN]: '#FFCA28',
        [LogLevel.ERROR]: '#EF5350',
        [LogLevel.NONE]: '#9E9E9E',
      };
      
      const levelColor = levelColors[log.level] || '#9E9E9E';
      
      // Create HTML for the log entry
      logLine.innerHTML = `
        <span class="log-time">[${time}]</span>
        <span class="log-level" style="color: ${levelColor};">${LogLevel[log.level]}</span>
        <span class="log-namespace">[${log.namespace}]</span>
        <span class="log-message">${this.escapeHtml(log.message)}</span>
      `;
      
      // Add data if available
      if (log.data) {
        const dataEl = createElement<HTMLDivElement>("div", "log-data");
        dataEl.style.paddingLeft = "20px";
        dataEl.style.color = "#777";
        dataEl.style.fontSize = "12px";
        dataEl.textContent = JSON.stringify(log.data);
        logLine.appendChild(dataEl);
      }
      
      // Style based on level
      switch (log.level) {
        case LogLevel.ERROR:
          logLine.style.backgroundColor = "rgba(239, 83, 80, 0.05)";
          logLine.style.borderLeft = "3px solid #EF5350";
          break;
        case LogLevel.WARN:
          logLine.style.backgroundColor = "rgba(255, 202, 40, 0.05)";
          logLine.style.borderLeft = "3px solid #FFCA28";
          break;
      }
      
      logLine.style.padding = "3px 0 3px 5px";
      logLine.style.borderBottom = "1px solid #eee";
      
      logContent.appendChild(logLine);
    });
    
    // Update status bar
    statusBar.textContent = `${filteredLogs.length} of ${logs.length} logs displayed`;
    
    // Scroll to bottom if we were already at the bottom
    const container = this.rootElement.querySelector('.log-display-container') as HTMLElement;
    if (container) {
      const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 50;
      
      if (isScrolledToBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }

  /**
 * Creates the performance tab content
 */
private createPerformanceTab(): void {
    // Create tab content container
    const content = createElement<HTMLDivElement>("div", "tab-content");
    content.style.padding = "16px";
    content.style.overflow = "auto";
    content.style.maxHeight = "calc(80vh - 120px)";
    
    // Performance Monitoring Section
    const perfSection = this.createSection("Performance Monitoring");
    
    const perfDescription = createElement<HTMLParagraphElement>("p");
    perfDescription.innerHTML = `
      The logger provides performance monitoring capabilities.<br>
      To use it, add the following code to measure performance:
    `;
    perfDescription.style.fontSize = "14px";
    perfDescription.style.margin = "0 0 12px 0";
    perfSection.appendChild(perfDescription);
    
    const codeExample = createElement<HTMLPreElement>("pre");
    codeExample.style.backgroundColor = "#f5f5f5";
    codeExample.style.padding = "12px";
    codeExample.style.borderRadius = "4px";
    codeExample.style.fontSize = "13px";
    codeExample.style.overflow = "auto";
    codeExample.style.margin = "0 0 16px 0";
    
    codeExample.textContent = `// Basic performance measurement
  const logger = createLogger("YourComponent");
  logger.startPerformanceMeasurement("operation");
  // ... your code here ...
  logger.endPerformanceMeasurement("operation");
  
  // Track a function automatically
  const result = logger.trackFunction("operation", () => {
    // ... your function code ...
    return someValue;
  });
  
  // Track async functions
  const result = await logger.trackAsyncFunction("asyncOperation", async () => {
    // ... your async function code ...
    return await someAsyncValue;
  });`;
    
    perfSection.appendChild(codeExample);
    
    // Example Usage Section
    const exampleSection = this.createSection("Example Usage");
    
    const exampleDescription = createElement<HTMLParagraphElement>("p");
    exampleDescription.textContent = "Try out performance measurement here:";
    exampleDescription.style.fontSize = "14px";
    exampleDescription.style.margin = "0 0 12px 0";
    exampleSection.appendChild(exampleDescription);
    
    // Create test buttons
    const buttonContainer = createElement<HTMLDivElement>("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "10px";
    buttonContainer.style.marginBottom = "16px";
    
    // Simple test button
    const testButton1 = this.createButton("Test Simple Measurement", "#e3f2fd");
    testButton1.addEventListener("click", () => {
      try {
        // Use Logger class directly instead of createLogger
        const demoLogger = new Logger("PerfDemo");
        
        // Simple performance test
        demoLogger.info("Starting simple performance test");
        demoLogger.startPerformanceMeasurement("simpleTest");
        
        // Do some simple work
        let sum = 0;
        for (let i = 0; i < 100000; i++) {
          sum += i;
        }
        
        const elapsed = demoLogger.endPerformanceMeasurement("simpleTest");
        demoLogger.info(`Simple test completed in ${elapsed.toFixed(2)}ms`);
        
        // Show confirmation to user
        alert(`Simple measurement completed in ${elapsed.toFixed(2)}ms with result: ${sum}`);
      } catch (error) {
        console.error("Simple measurement test failed:", error);
        alert(`Error in simple test: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
    
    // Function tracking test button
    const testButton2 = this.createButton("Test Function Tracking", "#e3f2fd");
    testButton2.addEventListener("click", () => {
      try {
        // Use Logger class directly instead of createLogger
        const demoLogger = new Logger("PerfDemo");
        
        demoLogger.info("Starting function tracking test");
        
        // Track function execution
        const result = demoLogger.trackFunction("functionTest", () => {
          // Simple calculation
          let sum = 0;
          for (let i = 0; i < 50000; i++) {
            sum += Math.sqrt(i);
          }
          return sum;
        });
        
        demoLogger.info(`Function tracking test completed, result: ${Math.floor(result)}`);
        
        // Show confirmation to user
        alert(`Function tracking test completed with result: ${Math.floor(result)}. Check the logs for details!`);
      } catch (error) {
        console.error("Function tracking test failed:", error);
        alert(`Error in function tracking test: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
    
    buttonContainer.appendChild(testButton1);
    buttonContainer.appendChild(testButton2);
    exampleSection.appendChild(buttonContainer);
    
    // Results section
    const resultsSection = this.createSection("Performance Results");
    resultsSection.style.backgroundColor = "#f9f9f9";
    
    const resultsDescription = createElement<HTMLParagraphElement>("p");
    resultsDescription.textContent = "Performance test results will appear in the logs. Open the Logs tab to view detailed timing information.";
    resultsDescription.style.fontSize = "14px";
    resultsDescription.style.margin = "0 0 12px 0";
    resultsSection.appendChild(resultsDescription);
    
    // Add a button to switch to logs tab
    const viewLogsButton = this.createButton("View Logs", "#4285f4");
    viewLogsButton.style.color = "white";
    viewLogsButton.addEventListener("click", () => {
      this.showTab('logs');
    });
    resultsSection.appendChild(viewLogsButton);
    
    // Add all sections to content
    content.appendChild(perfSection);
    content.appendChild(exampleSection);
    content.appendChild(resultsSection);
    
    // Add to root and store reference
    this.rootElement.appendChild(content);
    this.tabContents['performance'] = content;
  }

  /**
   * Creates a styled section with a title
   * @param title - Section title
   * @returns Section element
   */
  private createSection(title: string): HTMLElement {
    const section = createElement<HTMLDivElement>("div", "config-section");
    section.style.marginBottom = "20px";
    section.style.padding = "16px";
    section.style.backgroundColor = "#fff";
    section.style.borderRadius = "4px";
    section.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
    
    // Create section title
    const sectionTitle = createElement<HTMLHeadingElement>("h3");
    sectionTitle.textContent = title;
    sectionTitle.style.margin = "0 0 12px 0";
    sectionTitle.style.fontSize = "15px";
    sectionTitle.style.fontWeight = "500";
    sectionTitle.style.color = "#333";
    section.appendChild(sectionTitle);
    
    return section;
  }

  /**
   * Creates a labeled control group
   * @param label - Label text
   * @returns Container element
   */
  private createControlGroup(label: string): HTMLElement {
    const container = createElement<HTMLDivElement>("div", "control-group");
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.marginBottom = "12px";
    
    const labelEl = createElement<HTMLLabelElement>("label");
    labelEl.textContent = label;
    labelEl.style.marginRight = "10px";
    labelEl.style.fontSize = "14px";
    labelEl.style.minWidth = "150px";
    
    container.appendChild(labelEl);
    return container;
  }

  /**
   * Creates a checkbox control with label
   * @param label - Checkbox label
   * @param checked - Initial checked state
   * @param onChange - Change event handler
   * @returns Container element
   */
  private createCheckboxControl(
    label: string,
    checked: boolean,
    onChange: (checked: boolean) => void
  ): HTMLElement {
    const container = createElement<HTMLDivElement>("div", "checkbox-control");
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.marginBottom = "10px";
    
    const checkbox = createElement<HTMLInputElement>("input", "", {
      type: "checkbox"
    });
    checkbox.checked = checked;
    checkbox.style.marginRight = "8px";
    
    checkbox.addEventListener("change", () => {
      onChange(checkbox.checked);
    });
    
    const labelEl = createElement<HTMLLabelElement>("label");
    labelEl.textContent = label;
    labelEl.style.fontSize = "14px";
    labelEl.style.userSelect = "none";
    labelEl.style.cursor = "pointer";
    
    // Make label click toggle checkbox
    labelEl.addEventListener("click", () => {
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event("change"));
    });
    
    container.appendChild(checkbox);
    container.appendChild(labelEl);
    
    return container;
  }

  /**
   * Creates a styled button
   * @param text - Button text
   * @param bgColor - Background color
   * @returns Button element
   */
  private createButton(text: string, bgColor: string): HTMLButtonElement {
    const button = createElement<HTMLButtonElement>("button");
    button.textContent = text;
    button.style.padding = "8px 12px";
    button.style.border = "none";
    button.style.borderRadius = "4px";
    button.style.backgroundColor = bgColor;
    button.style.cursor = "pointer";
    button.style.fontSize = "14px";
    button.style.fontWeight = "500";
    button.style.transition = "background-color 0.2s";
    
    // Hover effect
    button.addEventListener("mouseenter", () => {
      button.style.filter = "brightness(0.95)";
    });
    
    button.addEventListener("mouseleave", () => {
      button.style.filter = "brightness(1)";
    });
    
    return button;
  }

  /**
   * Escapes HTML special characters to prevent XSS
   * @param str - String to escape
   * @returns Escaped string
   */
  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

/**
 * Initializes the logger configurator
 * Should be called after the header is created
 */
export function initLoggerConfigurator(): void {
  new LoggerConfigurator();
}