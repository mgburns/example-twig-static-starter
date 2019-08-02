(function(Modernizr) {
  if (Modernizr.emoji) {
    const placeholder = document.getElementById('insert-emoji-here');

    if (placeholder) {
      const canvas = document.createElement('canvas');
      canvas.setAttribute('width', 32);
      canvas.setAttribute('height', 32);
      placeholder.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f00';
      ctx.textBaseline = 'top';
      ctx.font = '32px Arial';
      ctx.fillText('\ud83d\udc28', 0, 0);
    }
  }
})(window.Modernizr);
