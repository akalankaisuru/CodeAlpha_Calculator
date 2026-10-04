// ---------- Get elements ----------
const currentEl = document.getElementById('current');
const previousEl = document.getElementById('previous');
const buttonsEl = document.querySelector('.buttons');

// ---------- Calculator state ----------
let current = '0';          // number being typed / shown
let previous = '';          // first number, waiting for the second
let operator = null;        // + − × ÷
let awaitingNumber = false; // true right after pressing an operator
let justCalculated = false; // true right after pressing =
let lastExpression = '';    // e.g. "12 × 3 ="

// ---------- Display ----------
function updateDisplay() {
  currentEl.textContent = current;

  if (operator) {
    previousEl.textContent = `${previous} ${operator}`;
  } else if (justCalculated) {
    previousEl.textContent = lastExpression;
  } else {
    previousEl.textContent = '';
  }
}

// ---------- Actions ----------
function appendNumber(num) {
  if (current === 'Error') clearAll();

  // Start a fresh number after an operator or after "="
  if (awaitingNumber || justCalculated) {
    current = '0';
    awaitingNumber = false;
    justCalculated = false;
  }

  if (num === '.' && current.includes('.')) return; // only one decimal point
  if (current.replace('-', '').replace('.', '').length >= 15) return; // length limit

  if (current === '0' && num !== '.') {
    current = num;
  } else {
    current += num;
  }
}

function chooseOperator(op) {
  if (current === 'Error') return;

  // Pressed two operators in a row: just change the operator
  if (operator && awaitingNumber) {
    operator = op;
    return;
  }

  // Chain calculations: 2 + 3 + ... calculates 2 + 3 first
  if (operator) {
    calculate();
    if (current === 'Error') return;
  }

  previous = current;
  operator = op;
  awaitingNumber = true;
  justCalculated = false;
  current = '0';
}

function calculate() {
  if (!operator || awaitingNumber) return;

  const a = parseFloat(previous);
  const b = parseFloat(current);
  let result;

  switch (operator) {
    case '+': result = a + b; break;
    case '−': result = a - b; break;
    case '×': result = a * b; break;
    case '÷':
      if (b === 0) {
        current = 'Error';
        previous = '';
        operator = null;
        return;
      }
      result = a / b;
      break;
  }

  lastExpression = `${previous} ${operator} ${current} =`;
  // toPrecision fixes problems like 0.1 + 0.2 = 0.30000000000000004
  current = String(parseFloat(result.toPrecision(12)));
  previous = '';
  operator = null;
  justCalculated = true;
}

function clearAll() {
  current = '0';
  previous = '';
  operator = null;
  awaitingNumber = false;
  justCalculated = false;
  lastExpression = '';
}

function deleteLast() {
  if (current === 'Error') return clearAll();
  if (awaitingNumber) return;

  justCalculated = false;
  current = current.slice(0, -1);
  if (current === '' || current === '-') current = '0';
}

function percent() {
  if (current === 'Error') return;
  current = String(parseFloat((parseFloat(current) / 100).toPrecision(12)));
}

// ---------- Handle any button (mouse or keyboard) ----------
function handleButton(button) {
  const { number, operator: op, action } = button.dataset;

  if (number !== undefined) appendNumber(number);
  else if (op !== undefined) chooseOperator(op);
  else if (action === 'equals') calculate();
  else if (action === 'clear') clearAll();
  else if (action === 'delete') deleteLast();
  else if (action === 'percent') percent();

  updateDisplay();
}

// One listener for all buttons (event delegation)
buttonsEl.addEventListener('click', event => {
  const button = event.target.closest('.btn');
  if (button) handleButton(button);
});

// ---------- Keyboard support ----------
const operatorKeys = { '+': '+', '-': '−', '*': '×', 'x': '×', 'X': '×', '/': '÷' };

function getSelector(key) {
  if (/^[0-9.]$/.test(key)) return `[data-number="${key}"]`;
  if (operatorKeys[key]) return `[data-operator="${operatorKeys[key]}"]`;
  if (key === 'Enter' || key === '=') return '[data-action="equals"]';
  if (key === 'Backspace') return '[data-action="delete"]';
  if (key === 'Escape' || key === 'Delete') return '[data-action="clear"]';
  if (key === '%') return '[data-action="percent"]';
  return null;
}

document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  const selector = getSelector(event.key);
  if (!selector) return;

  event.preventDefault(); // stops "/" quick-find and Enter re-clicking a button

  const button = document.querySelector(selector);
  button.classList.add('pressed'); // shows the 3D press animation
  setTimeout(() => button.classList.remove('pressed'), 120);
  handleButton(button);
});

updateDisplay();