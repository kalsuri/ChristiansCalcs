import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from sympy import Piecewise, symbols, pi, sin, cos, exp, integrate, lambdify, sympify

# Define symbols globally
x, L, n = symbols('x L n', real=True, positive=True)

def parse_input(input_args):
    import json
    import sys
    try:
        args = json.loads(input_args)
        start = float(args['start'])
        end = float(args['end'])
        damping = float(args['alpha'])
        N = int(args['N'])
        # Include sin, cos, exp, pi in the namespace for sympify to recognize
        u_x_0_expr = sympify(args['function_of_x'], locals={'x': x, 'sin': sin, 'cos': cos, 'exp': exp, 'pi': pi,'Piecewise': Piecewise})
        return start, end, N, u_x_0_expr, damping
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

def compute_fourier_series(start, end, N, u_x_0_expr):
    L_value = end  # Domain length
    A_n_values = [
        2/L_value * integrate(u_x_0_expr * sin(n*pi*x/L_value), (x, start, end)).simplify()
        for n in range(1, N+1)
    ]
    A_n_funcs = [lambdify(x, A_n.subs(L, L_value), 'numpy') for A_n in A_n_values]
    return A_n_funcs

def animate_fourier_series(A_n_funcs, start, end, N, damping, filename='waveOverlay.gif'):
    t_values = np.linspace(0, 24//4, 1200//4)
    x_values = np.linspace(start, end, 100)

    def u_numeric(x, t, N, damping=0):
        sum_series = 0
        for n in range(1, N + 1):
            An = float(A_n_funcs[n-1](x))  # Retrieve the nth coefficient's value
            # Summation of the series terms
            sum_series += An * np.sin(n * np.pi * x / end) * np.exp(-damping * t) * np.cos(n * np.pi * t / end)
        return sum_series

    X, T = np.meshgrid(x_values, t_values)
    u_vec = np.vectorize(u_numeric)  # Vectorize the solution function for efficiency
    U_values = u_vec(X, T, N)  # Calculate u(x,t) over the grid

    fig, ax = plt.subplots()
    # line, = ax.plot([], [], lw=2)
    ax.set_xlim([start, end])
    ax.set_ylim([1.1*np.min(U_values), 1.1*np.max(U_values)])

    # Initialize lines for plotting undamped and damped solutions
    line_main, = ax.plot([], [], lw=2, label='Undampened')
    line_dampened, = ax.plot([], [], lw=2, label='Dampened', linestyle='--')
    
    u_x_0_func = lambdify(x, u_x_0_expr.subs(L, end), modules=['numpy'])
    
    # Plot the piecewise function for the initial state
    x_static = np.linspace(0, end, 100)
    y_static = u_x_0_func(x_static)
    line_static, = ax.plot(x_static, y_static, lw=2, label='Initial State', color='red')
    
    # Initialize function for the animation
    def init():
        line_main.set_data([], [])
        line_dampened.set_data([], [])
        return line_main, line_dampened, line_static

    # Define the animation function
    def animate(i):
        x = x_values
        y_undampened = U_values[i, :]  # Get undamped solution at time step i
        y_dampened = u_vec(x, T[i, :], N, 0.1)  # Get damped solution at time step i

        # Update the lines with the new data
        line_main.set_data(x, y_undampened)
        line_dampened.set_data(x, y_dampened)
        return line_main, line_dampened, line_static

    anim = FuncAnimation(fig, animate, init_func=init, frames=len(t_values), interval=50, blit=True)
    anim.save(filename, writer='pillow', fps=30)
    plt.close(fig)
    print("waveOverlay.gif")  # This should be the only print statement that outputs the filename

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        input_args = sys.argv[1]
        start, end, N, u_x_0_expr, damping = parse_input(input_args)
        A_n_funcs = compute_fourier_series(start, end, N, u_x_0_expr)
        # Change the file path below
        animate_fourier_series(A_n_funcs, start, end, N, damping, filename='public/img/waveOverlay.gif')
    else:
        print("Usage: python script.py '{\"start\": 0, \"end\": 1, \"alpha\": 0.1, \"N\": 10, \"function_of_x\": \"sin(x)\"}'")
