const amplitude = document.querySelector('#amplitude');
const frequency = document.querySelector('#frequency');
function draw() {
  const a = Number(amplitude.value);
  const f = Number(frequency.value);
  document.querySelector('#amplitude-value').value = a;
  document.querySelector('#frequency-value').value = f;
  document.querySelector('#wave-desc').textContent = `Амплитуда ${a}, частота ${f}.`;
  const points = Array.from({ length: 601 }, (_, x) => {
    const y = 150 - a * Math.sin(2 * Math.PI * f * x / 600);
    return `${x === 0 ? 'M' : 'L'}${x},${y.toFixed(2)}`;
  });
  document.querySelector('#wave').setAttribute('d', points.join(' '));
}
[amplitude, frequency].forEach(input => input.addEventListener('input', draw));
document.querySelector('#reset').addEventListener('click', () => {
  amplitude.value = 50;
  frequency.value = 2;
  draw();
});
draw();
