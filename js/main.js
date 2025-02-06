document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.startGame();

    // Add touch event handling
    const gameContainer = document.querySelector('.game-container');
    
    // Prevent default touch behaviors
    gameContainer.addEventListener('touchstart', (e) => {
        if (e.target.classList.contains('card') || e.target.classList.contains('action-btn')) {
            e.preventDefault();
        }
    }, { passive: false });

    // Handle touch events for the raise slider
    const raiseSlider = document.getElementById('raise-slider');
    raiseSlider.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    raiseSlider.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    // Add New Game button functionality
    const newGameBtn = document.createElement('button');
    newGameBtn.textContent = 'New Game';
    newGameBtn.className = 'action-btn';
    newGameBtn.style.marginRight = 'auto';
    document.querySelector('.controls').prepend(newGameBtn);
    
    newGameBtn.addEventListener('click', () => {
        game.startGame();
    });
});