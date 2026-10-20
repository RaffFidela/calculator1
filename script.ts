type Operator = "+" | "-" | "*" | "/";
type Action = "clear" | "sign" | "percent" | "decimal" | "equals" | "backspace";
type Input =
    | { type: "number"; value: string }
    | { type: "operator"; value: Operator }
    | { type: "action"; value: Action };

function getElement<T extends Element>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`Calculator element not found: ${selector}`);
    return element;
}

const currentDisplay = getElement<HTMLOutputElement>("#current-display");
const previousDisplay = getElement<HTMLElement>("#previous-display");
const keypad = getElement<HTMLElement>(".keypad");

let display = "0";
let storedValue: number | null = null;
let operator: Operator | null = null;
let replaceDisplay = false;

function render(): void {
    currentDisplay.textContent = display;
    previousDisplay.textContent = storedValue === null || operator === null
        ? ""
        : `${storedValue} ${{ "+": "+", "-": "−", "*": "×", "/": "÷" }[operator]}`;
}

function format(value: number): string {
    return Number.isFinite(value) ? String(Number(value.toPrecision(11))) : "Error";
}

function calculate(left: number, right: number, op: Operator): number {
    switch (op) {
        case "+": return left + right;
        case "-": return left - right;
        case "*": return left * right;
        case "/": return right === 0 ? NaN : left / right;
    }
}

function input(key: Input): void {
    if (key.type === "number") {
        if (display === "Error" || replaceDisplay) {
            display = key.value;
            replaceDisplay = false;
        } else if (display === "0") {
            display = key.value;
        } else if (display.replace(/[-.]/g, "").length < 12) {
            display += key.value;
        }
    } else if (key.type === "operator") {
        if (display === "Error") return;
        const value = Number(display);
        if (operator && storedValue !== null && !replaceDisplay) {
            display = format(calculate(storedValue, value, operator));
            if (display === "Error") {
                storedValue = null;
                operator = null;
                replaceDisplay = true;
                render();
                return;
            }
            storedValue = Number(display);
        } else {
            storedValue = value;
        }
        operator = key.value;
        replaceDisplay = true;
    } else {
        switch (key.value) {
            case "clear":
                display = "0";
                storedValue = null;
                operator = null;
                replaceDisplay = false;
                break;
            case "sign":
                if (display !== "0" && display !== "Error") {
                    display = display.startsWith("-") ? display.slice(1) : `-${display}`;
                }
                break;
            case "percent":
                if (display !== "Error") display = format(Number(display) / 100);
                break;
            case "decimal":
                if (display === "Error" || replaceDisplay) {
                    display = "0";
                    replaceDisplay = false;
                }
                if (!display.includes(".")) display += ".";
                break;
            case "equals":
                if (operator && storedValue !== null && display !== "Error") {
                    display = format(calculate(storedValue, Number(display), operator));
                    storedValue = null;
                    operator = null;
                    replaceDisplay = true;
                }
                break;
            case "backspace":
                if (display !== "Error" && !replaceDisplay) {
                    display = display.length > 1 ? display.slice(0, -1) : "0";
                    if (display === "-") display = "0";
                }
        }
    }
    render();
}

keypad.addEventListener("click", (event: MouseEvent) => {
    const button = event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>("button")
        : null;
    if (!button) return;

    if (button.dataset.number !== undefined) {
        input({ type: "number", value: button.dataset.number });
    } else if (isOperator(button.dataset.operator)) {
        input({ type: "operator", value: button.dataset.operator });
    } else if (isAction(button.dataset.action)) {
        input({ type: "action", value: button.dataset.action });
    }
});

function isOperator(value: string | undefined): value is Operator {
    return value === "+" || value === "-" || value === "*" || value === "/";
}

function isAction(value: string | undefined): value is Exclude<Action, "backspace"> {
    return value === "clear" || value === "sign" || value === "percent"
        || value === "decimal" || value === "equals";
}

document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (/^\d$/.test(event.key)) {
        input({ type: "number", value: event.key });
    } else if (isOperator(event.key)) {
        input({ type: "operator", value: event.key });
    } else {
        const actions: Record<string, Action | undefined> = {
            ".": "decimal",
            "%": "percent",
            Enter: "equals",
            "=": "equals",
            Escape: "clear",
            Delete: "clear",
            Backspace: "backspace",
        };
        const action = actions[event.key];
        if (action) input({ type: "action", value: action });
    }
});

render();
