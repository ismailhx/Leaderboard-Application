// Create scattered doodles all over the purple background
const createDoodles = () => {
    const doodleContainer = document.createElement('div');
    doodleContainer.id = 'doodle-container';
    doodleContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
    `;
    
    const doodleSymbols = [
        // Stars & Sparkles (monochrome only)
        '★', '☆', '✦', '✧', '✩', '✪', '✫', '✬', '✭', '✮', '✯', '✰', '✱', '✲', '✳', '✴', '✵', '✶', '✷', '✸', '✹', '✺', '✻', '✼', '✽', '✾', '✿', '❀',
        // Hearts & Suits
        '♡', '♥', '❣', '❥', '❦', '❧', '♠', '♣', '♦', '♢', '♧',
        // Flowers
        '⚘', '❀', '❁', '❂', '❃', '❄', '❅', '❆', '❇', '❈', '❉', '❊', '❋',
        // Music
        '♪', '♫', '♬', '♭', '♮', '♯', '♩',
        // Circles & Shapes
        '◯', '○', '●', '◐', '◑', '◒', '◓', '◔', '◕', '◖', '◗', '◠', '◡', '◢', '◣', '◤', '◥', '▲', '△', '▴', '▵', '▶', '▷', '▸', '▹', '►', '▻', '▼', '▽', '▾', '▿', '◀', '◁', '◂', '◃', '◄', '◅', '◆', '◇', '◈', '◉', '◊', '◌', '◍', '◎',
        // Crosses & Plus
        '✖', '✗', '✘', '✚', '✛', '✜', '✝', '✞', '✟', '✠', '✡', '✢', '✣', '✤', '✥',
        // Symbols
        '☯', '☸',
        // Arrows
        '←', '↑', '→', '↓', '↔', '↕', '↖', '↗', '↘', '↙', '↚', '↛', '↜', '↝', '↞', '↟', '↠', '↡', '↢', '↣', '⇐', '⇑', '⇒', '⇓', '⇔',
        // Writing
        '✎', '✏', '✐', '✑', '✒',
        // Chess
        '♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛', '♜', '♝', '♞', '♟',
        // Misc Dingbats
        '☙', '☠', '☡', '☢', '☣', '☤', '☥', '☦', '☧', '☨', '☩', '❢',
        // Geometric patterns
        '■', '□', '▢', '▣', '▤', '▥', '▦', '▧', '▨', '▩', '▪', '▫', '▬', '▭', '▮', '▯',
        // Box Drawing
        '─', '━', '│', '┃', '┌', '┍', '┎', '┏', '┐', '┑', '┒', '┓', '└', '┕', '┖', '┗', '┘', '┙', '┚', '┛',
        // Dots & Bullets
        '•', '‣', '⁃', '⁌', '⁍',
        // More shapes
        '◘', '◙', '◚', '◛', '◜', '◝', '◞', '◟', '◦', '◫', '◬', '◭', '◮'
    ];
    
    // Create a grid to ensure even distribution
    const gridSize = 10; // 10x10 grid = 100 cells
    const cellsPerDoodle = (gridSize * gridSize) / 200; // ~0.5, so we'll place 2 per cell on average
    
    for (let i = 0; i < 200; i++) {
        const doodle = document.createElement('div');
        const symbol = doodleSymbols[Math.floor(Math.random() * doodleSymbols.length)];
        
        // Random size: tiny to massive with more variation
        const sizes = [0.5, 0.7, 0.9, 1.1, 1.3, 1.6, 1.9, 2.2, 2.6, 3, 3.5, 4, 4.5, 5, 6, 7];
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        
        // Distribute evenly across grid with randomness within each cell
        const cellIndex = Math.floor(i / 2); // 2 doodles per cell
        const gridRow = Math.floor(cellIndex / gridSize);
        const gridCol = cellIndex % gridSize;
        
        // Position within cell (10% grid) + random offset within that cell
        const top = (gridRow * 10) + (Math.random() * 10);
        const left = (gridCol * 10) + (Math.random() * 10);
        
        // Random rotation
        const rotation = Math.random() * 360;
        
        // Random opacity with more variation
        const opacity = 0.05 + Math.random() * 0.18; // Between 0.05 and 0.23
        
        doodle.textContent = symbol;
        doodle.style.cssText = `
            position: absolute;
            top: ${top}%;
            left: ${left}%;
            font-size: ${size}em;
            color: rgba(255, 255, 255, ${opacity});
            transform: rotate(${rotation}deg);
            animation: doodleFloat ${5 + Math.random() * 10}s ease-in-out infinite;
            animation-delay: ${Math.random() * 5}s;
        `;
        
        doodleContainer.appendChild(doodle);
    }
    
    document.body.insertBefore(doodleContainer, document.body.firstChild);
};

// Add floating animation
const style = document.createElement('style');
style.textContent = `
    @keyframes doodleFloat {
        0%, 100% { 
            transform: translateY(0px) rotate(0deg) scale(1);
        }
        25% {
            transform: translateY(-10px) rotate(5deg) scale(1.05);
        }
        50% {
            transform: translateY(-5px) rotate(-3deg) scale(0.98);
        }
        75% {
            transform: translateY(-15px) rotate(3deg) scale(1.02);
        }
    }
`;
document.head.appendChild(style);

// Initialize doodles when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createDoodles);
} else {
    createDoodles();
}
