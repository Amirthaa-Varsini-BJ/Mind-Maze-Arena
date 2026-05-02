# Mind Maze Arena – The Maze That Hunts You

Mind Maze Arena is a turn-based, AI-driven strategy game where players must navigate a dynamically changing grid-based maze. The unique challenge lies in the **Maze Controller AI**, which observes your movement patterns in real-time and modifies the level to trap you.

![Game Concept](https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000&auto=format&fit=crop)

## 🎮 Core Gameplay Mechanics
- **Turn-Based Movement**: Every move you make triggers a reaction from the environment.
- **Dynamic Adaptation**: The maze shifts every 3 turns based on your "Player Classification".
- **Survival or Escape**: Reach the target exit within 5 increasingly difficult levels.

## 🧠 The AI "Maze Controller"
The AI doesn't move a character; it manipulates reality. It tracks your:
- **Directional Frequency**: Which way do you prefer to turn?
- **Behavior Profile**:
    - **Aggressive**: Takes direct paths. AI responds by placing traps in predicted routes.
    - **Defensive**: Plays safe. AI responds by narrowing corridors and closing paths.
    - **Explorer**: Moves randomly. AI responds by frequently randomizing the tiles.
- **Memory Echoes**: The AI leaves visual traces of your previous paths, using them to calculate your next likely position.

## 🧱 Tile Types
- **Empty (Default)**: Normal walkable path.
- **Wall (Indigo)**: Structural blockades.
- **Trap (Red)**: Damages your integrity. Hit zero and the maze wins.
- **Teleport (Purple)**: Randomly shifts your position across the grid.
- **Illusion (Ghostly)**: Paths that appear safe but turn into solid walls every 4 turns.
- **Exit (Amber)**: Your gateway to the next level.

## 🛠️ Technical Stack
- **React 19 + TypeScript**: For strict type safety and component architecture.
- **Vite**: Ultra-fast build tool and dev server.
- **Tailwind CSS 4**: Modern utility-first styling for the "Neural-Net" aesthetic.
- **Motion (Framer Motion)**: Smooth, spring-based animations for the player and maze transitions.
- **Lucide React**: Clean, consistent iconography.

