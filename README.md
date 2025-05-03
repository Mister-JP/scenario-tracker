# Scenario Viewer

An interactive web application for visualizing and connecting multiple scenario views. This tool allows you to create a visual flow diagram by connecting different scenario cards with arrows.

## Features

- **Interactive Cards**: Drag, resize, and organize scenario cards
- **Connector System**: Create visual flows by connecting cards with arrows
- **Layout Management**: Save and load card layouts with JSON
- **Responsive Design**: Works across different screen sizes
- **Modular Architecture**: Clean, maintainable code structure

## Project Structure

```
src/
  components/           # UI components 
    card/               # Card creation and behavior
    connector/          # Connection management
    dialog/             # Modal dialog system
    header/             # Application header
  
  core/                 # Core functionality
    state/              # Application state
    layout/             # Layout management
    
  utils/                # Shared utilities
  types/                # Type definitions
  main.ts               # Application entry point

public/
  assets/               # Compiled JavaScript
  icons/                # SVG icons
  index.html            # Main HTML file
  style.css             # Stylesheet
```

## Setup Instructions

1. Configure the port in `bs-config.js` to your preferred value (default: 8081)
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```

This will compile TypeScript files and launch a lite-server instance.

## Usage

- **Drag Cards**: Use the handle in the top-left corner to move cards
- **Resize Cards**: Drag the bottom-right corner to resize cards
- **Connect Cards**: Drag from a dot on one card to a dot on another card
- **Save/Load Layout**: Use the buttons in the header
- **Reset Layout**: Click the "Reset" button to arrange cards in a grid
- **Edit Host**: Click the pencil icon to change the tracking host

## Development

- The application uses TypeScript for type safety
- CSS is organized by component for better maintainability
- Event-driven architecture for component communication

## Extending the Project

To add new scenarios:
1. Update the `SCENARIOS` array in `src/core/state/index.ts`
2. Reload the application

To modify the grid layout:
1. Adjust the constants in `src/core/state/index.ts`
2. The grid will be updated on next reset

## License

ISC