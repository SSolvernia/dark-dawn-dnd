# Dark Dawn DnD

A Next.js application dedicated to generating D&D 5e components and tools for tabletop gaming enthusiasts.

## 🎲 Project Overview

Dark Dawn DnD is a web application that provides various generators and tools for Dungeons & Dragons 5th Edition. The project aims to help Dungeon Masters and players quickly create and manage game components.

### Available Tools

- **Character Generator** (`/dnd-char-gen`) - Generate random D&D characters with customizable options:
  - Select from multiple D&D sourcebooks (PHB, Xanathar's, Tasha's, etc.)
  - Generate complete character profiles including race, class, background
  - Create both adventurer (PC) and civilian (NPC) characters
  - Generate character cards with custom artwork
  - Export characters as plain text or visual cards

### Planned Features

- **PC Options Reference** - Quick reference for player character options
- **Magic Item Generator** - Generate random magic items
- **Statblock Generator** - Create monster/NPC statblocks

## 🛠️ Technology Stack

- **Framework**: Next.js 16 with App Router
- **React**: 19.2.0 with React Compiler
- **Styling**: Tailwind CSS v4 + Custom CSS
- **Fonts**: Geist Sans & Geist Mono
- **Build Tool**: Webpack

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd dark-dawn-dnd
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Run production server
npm run lint     # Run ESLint checks
```

## 📁 Project Structure

```
src/
  app/
    dnd-char-gen/          # Character generator page
      page.js              # Main component
      dnd-char-gen.css     # Custom styles
    layout.js              # Root layout
    page.js                # Homepage
    globals.css            # Global styles
public/
  dndimages/               # D&D themed images and backgrounds
```

## 🎨 Visual Design

The application features a classic D&D aesthetic with:
- Parchment/paper texture backgrounds
- Medieval-inspired typography (Georgia, Tahoma)
- Responsive design for mobile, tablet, and desktop
- Dark red accent colors and forest green buttons

## 🙏 Credits

The D&D component generators are based on the excellent work by [Tetra-cube](https://github.com/Tetra-cube/Tetra-cube.github.io). The original HTML/CSS/JS implementations have been adapted and modernized for this Next.js application.

**Original Project**: https://github.com/Tetra-cube/Tetra-cube.github.io
**Live Demo of Original**: https://tetra-cube.com/dnd/

Special thanks to Tetra-cube for creating these comprehensive D&D generators and making them available as open source.

## 📝 License

This project builds upon the work of Tetra-cube. Please refer to the original repository for licensing information.

## 🔮 Future Development

- Add full interactivity to character generator
- Implement canvas-based character cards
- Add data persistence (localStorage/database)
- Implement remaining generators (magic items, statblocks)
- Add character export/import functionality
- Create mobile-optimized versions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📚 Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [D&D 5e SRD](https://dnd.wizards.com/resources/systems-reference-document)
