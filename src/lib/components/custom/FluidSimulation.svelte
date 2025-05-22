<script lang="ts">
    import { onMount, onDestroy } from "svelte";

    // Canvas and context variables
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    // Props for dynamic sizing (now optional with defaults)
    export let width: number | undefined = undefined;
    export let height: number | undefined = undefined;

    // Variables for responsive sizing
    let canvas_width: number = width || window.innerWidth;
    let canvas_height: number = height || window.innerHeight;
    let resolution: number = 10; // Size of each grid cell
    let pen_size: number = 40; // Radius of mouse influence
    let num_cols: number = Math.ceil(canvas_width / resolution);
    let num_rows: number = Math.ceil(canvas_height / resolution);

    // Calculate particle count based on screen size (for performance)
    function calculateParticleCount(): number {
        const screenArea = canvas_width * canvas_height;
        const baseCount = 3000; // Base count for smaller screens
        const maxCount = 8000; // Maximum count for larger screens

        // Scale particle count based on screen area
        const count = Math.min(maxCount, baseCount + (screenArea / (1920 * 1080)) * 2000);
        return Math.floor(count);
    }

    let speck_count: number = calculateParticleCount();
    let resizeTimeout: number | undefined;

    // State variables
    let vec_cells: Cell[][] = []; // Grid of cells
    let particles: Particle[] = []; // Array of particles
    let mouse: MouseState = {
        x: canvas_width / 2, // Start at center
        y: canvas_height / 2,
        px: canvas_width / 2,
        py: canvas_height / 2,
        down: false,
    };
    let rafId: number; // Animation frame ID for cleanup
    let initialAnimationRunning = false; // Flag to track if initial animation is running

    // Type definitions
    interface Cell {
        x: number;
        y: number;
        r: number;
        col: number;
        row: number;
        xv: number;
        yv: number;
        pressure: number;
        up: Cell;
        left: Cell;
        up_left: Cell;
        up_right: Cell;
        down: Cell;
        right: Cell;
        down_left: Cell;
        down_right: Cell;
    }

    interface Particle {
        x: number;
        px: number;
        y: number;
        py: number;
        xv: number;
        yv: number;
    }

    interface MouseState {
        x: number;
        y: number;
        px: number;
        py: number;
        down: boolean;
    }

    // Cell constructor
    function createCell(x: number, y: number, res: number): Partial<Cell> {
        return {
            x,
            y,
            r: res,
            col: 0,
            row: 0,
            xv: 0,
            yv: 0,
            pressure: 0,
        };
    }

    // Particle constructor
    function createParticle(x: number, y: number): Particle {
        return {
            x,
            px: x,
            y,
            py: y,
            xv: 0,
            yv: 0,
        };
    }

    // Handle window resize
    function handleResize(): void {
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }

        // Debounce resize to avoid too many recalculations
        resizeTimeout = setTimeout(() => {
            // Update dimensions based on window size or props
            canvas_width = width || window.innerWidth;
            canvas_height = height || window.innerHeight;

            // Update grid dimensions
            num_cols = Math.ceil(canvas_width / resolution);
            num_rows = Math.ceil(canvas_height / resolution);

            // Update particle count based on new dimensions
            speck_count = calculateParticleCount();

            // Only reinitialize if canvas exists
            if (canvas && ctx) {
                // Update canvas size
                canvas.width = canvas_width;
                canvas.height = canvas_height;

                // Reset simulation
                resetSimulation();
            }
        }, 200) as unknown as number;
    }

    // Reset and reinitialize the simulation
    function resetSimulation(): void {
        // Clear existing data
        vec_cells = [];
        particles = [];

        // Reinitialize
        initializeSimulation();
    }

    // Initialize the simulation
    function initializeSimulation(): void {
        // Create particles with small initial velocities
        for (let i = 0; i < speck_count; i++) {
            const p = createParticle(Math.random() * canvas_width, Math.random() * canvas_height);
            p.xv = (Math.random() - 0.5) * 2; // Random value between -1 and 1
            p.yv = (Math.random() - 0.5) * 2; // Random value between -1 and 1
            particles.push(p);
        }

        // Create grid cells
        for (let col = 0; col < num_cols; col++) {
            vec_cells[col] = [];
            for (let row = 0; row < num_rows; row++) {
                const cell_data = createCell(col * resolution, row * resolution, resolution);
                vec_cells[col][row] = cell_data as Cell;
                vec_cells[col][row].col = col;
                vec_cells[col][row].row = row;
            }
        }

        // Set up cell neighbors
        for (let col = 0; col < num_cols; col++) {
            for (let row = 0; row < num_rows; row++) {
                const cell_data = vec_cells[col][row];
                const row_up = row - 1 >= 0 ? row - 1 : num_rows - 1;
                const col_left = col - 1 >= 0 ? col - 1 : num_cols - 1;
                const col_right = col + 1 < num_cols ? col + 1 : 0;
                cell_data.up = vec_cells[col][row_up];
                cell_data.left = vec_cells[col_left][row];
                cell_data.up_left = vec_cells[col_left][row_up];
                cell_data.up_right = vec_cells[col_right][row_up];
                cell_data.up.down = cell_data;
                cell_data.left.right = cell_data;
                cell_data.up_left.down_right = cell_data;
                cell_data.up_right.down_left = cell_data;
            }
        }
    }

    // Initialize the canvas and start the simulation
    function init(): void {
        ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        canvas.width = canvas_width;
        canvas.height = canvas_height;

        // Initialize the simulation
        initializeSimulation();

        // Simulate an initial push
        simulateInitialPush();
    }

    // Simulate an initial mouse drag to push particles
    function simulateInitialPush(): void {
        initialAnimationRunning = true;
        mouse.down = true;
        const centerX = canvas_width / 2;
        const centerY = canvas_height / 2;
        // Calculate radius based on the smaller dimension of the canvas
        const minDimension = Math.min(canvas_width, canvas_height);
        const radius = minDimension * 0.25; // 25% of the smaller dimension
        const duration = 500; // Total duration in milliseconds (1.5 seconds)
        const steps = 60; // Number of animation steps (smoothness)
        let step = 0;

        function animateCircle() {
            if (step <= steps) {
                const angle = (step / steps) * 2 * Math.PI; // Full circle (0 to 2π)
                mouse.px = mouse.x;
                mouse.py = mouse.y;
                mouse.x = centerX + radius * Math.cos(angle);
                mouse.y = centerY + radius * Math.sin(angle);
                step++;
                setTimeout(animateCircle, duration / steps); // Step every ~25ms
            } else {
                mouse.down = false;
                mouse.x = 0;
                mouse.y = 0;
                mouse.px = 0;
                mouse.py = 0;
                initialAnimationRunning = false; // Animation is complete
            }
        }

        // Start the circular animation
        mouse.x = centerX + radius; // Initial position (right of center)
        mouse.y = centerY;
        mouse.px = centerX;
        mouse.py = centerY;
        animateCircle();
    }

    // Update particle positions and draw them
    function update_particle(): void {
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            if (p.x >= 0 && p.x < canvas_width && p.y >= 0 && p.y < canvas_height) {
                const col = Math.floor(p.x / resolution);
                const row = Math.floor(p.y / resolution);
                const cell_data = vec_cells[col][row];
                const ax = (p.x % resolution) / resolution;
                const ay = (p.y % resolution) / resolution;
                p.xv += (1 - ax) * cell_data.xv * 0.05;
                p.yv += (1 - ay) * cell_data.yv * 0.05;
                p.xv += ax * cell_data.right.xv * 0.05;
                p.yv += ax * cell_data.right.yv * 0.05;
                p.xv += ay * cell_data.down.xv * 0.05;
                p.yv += ay * cell_data.down.yv * 0.05;
                p.x += p.xv;
                p.y += p.yv;
                const dx = p.px - p.x;
                const dy = p.py - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const limit = Math.random() * 0.5;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                if (dist > limit) {
                    ctx.lineWidth = 1;
                    ctx.lineTo(p.px, p.py);
                } else {
                    ctx.lineTo(p.x + limit, p.y + limit);
                }
                ctx.stroke();
                p.px = p.x;
                p.py = p.y;
            } else {
                p.x = p.px = Math.random() * canvas_width;
                p.y = p.py = Math.random() * canvas_height;
                p.xv = 0;
                p.yv = 0;
            }
            p.xv *= 0.5;
            p.yv *= 0.5;
        }
    }

    // Main animation loop
    function draw(): void {
        const mouse_xv = mouse.x - mouse.px;
        const mouse_yv = mouse.y - mouse.py;

        for (let i = 0; i < vec_cells.length; i++) {
            const cell_datas = vec_cells[i];
            for (let j = 0; j < cell_datas.length; j++) {
                const cell_data = cell_datas[j];
                if (mouse.down) {
                    change_cell_velocity(cell_data, mouse_xv, mouse_yv, pen_size);
                }
                update_pressure(cell_data);
            }
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#4511c2";
        update_particle();

        for (let i = 0; i < vec_cells.length; i++) {
            const cell_datas = vec_cells[i];
            for (let j = 0; j < cell_datas.length; j++) {
                update_velocity(cell_datas[j]);
            }
        }

        mouse.px = mouse.x;
        mouse.py = mouse.y;

        rafId = requestAnimationFrame(draw);
    }

    // Adjust cell velocity based on mouse movement
    function change_cell_velocity(cell_data: Cell, mvelX: number, mvelY: number, pen_size: number): void {
        const dx = cell_data.x - mouse.x;
        const dy = cell_data.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < pen_size) {
            const power = dist < 4 ? pen_size : pen_size / dist;
            cell_data.xv += mvelX * power;
            cell_data.yv += mvelY * power;
        }
    }

    // Update cell pressure based on neighbors
    function update_pressure(cell_data: Cell): void {
        const pressure_x =
            cell_data.up_left.xv * 0.5 +
            cell_data.left.xv +
            cell_data.down_left.xv * 0.5 -
            cell_data.up_right.xv * 0.5 -
            cell_data.right.xv -
            cell_data.down_right.xv * 0.5;
        const pressure_y =
            cell_data.up_left.yv * 0.5 +
            cell_data.up.yv +
            cell_data.up_right.yv * 0.5 -
            cell_data.down_left.yv * 0.5 -
            cell_data.down.yv -
            cell_data.down_right.yv * 0.5;
        cell_data.pressure = (pressure_x + pressure_y) * 0.25;
    }

    // Update cell velocity based on pressure
    function update_velocity(cell_data: Cell): void {
        cell_data.xv +=
            (cell_data.up_left.pressure * 0.5 +
                cell_data.left.pressure +
                cell_data.down_left.pressure * 0.5 -
                cell_data.up_right.pressure * 0.5 -
                cell_data.right.pressure -
                cell_data.down_right.pressure * 0.5) *
            0.25;
        cell_data.yv +=
            (cell_data.up_left.pressure * 0.5 +
                cell_data.up.pressure +
                cell_data.up_right.pressure * 0.5 -
                cell_data.down_left.pressure * 0.5 -
                cell_data.down.pressure -
                cell_data.down_right.pressure * 0.5) *
            0.25;
        cell_data.xv *= 0.99;
        cell_data.yv *= 0.99;
    }

    // Event handlers
    function mouse_down_handler(e: MouseEvent): void {
        if (initialAnimationRunning) return; // Ignore if initial animation is running
        e.preventDefault();
        mouse.down = true;
    }

    function mouse_up_handler(): void {
        if (initialAnimationRunning) return; // Ignore if initial animation is running
        mouse.down = false;
    }

    function mouse_move_handler(e: MouseEvent): void {
        if (initialAnimationRunning) return; // Ignore if initial animation is running
        e.preventDefault();
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        mouse.x = e.offsetX;
        mouse.y = e.offsetY;
    }

    function touch_start_handler(e: TouchEvent): void {
        if (initialAnimationRunning) return; // Ignore if initial animation is running
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        mouse.x = mouse.px = e.touches[0].pageX - rect.left;
        mouse.y = mouse.py = e.touches[0].pageY - rect.top;
        mouse.down = true;
    }

    function touch_move_handler(e: TouchEvent): void {
        if (initialAnimationRunning) return; // Ignore if initial animation is running
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        mouse.x = e.touches[0].pageX - rect.left;
        mouse.y = e.touches[0].pageY - rect.top;
    }

    function touch_end_handler(e: TouchEvent): void {
        if (initialAnimationRunning) return; // Ignore if initial animation is running
        if (!e.touches) mouse.down = false;
    }

    // Lifecycle hooks
    onMount(() => {
        // Add resize event listener
        window.addEventListener("resize", handleResize);

        // Initialize the simulation
        init();
        draw();
    });

    onDestroy(() => {
        // Clean up event listeners and animation frame
        window.removeEventListener("resize", handleResize);
        if (resizeTimeout) clearTimeout(resizeTimeout);
        cancelAnimationFrame(rafId);
    });
</script>

<canvas
    on:mousedown={mouse_down_handler}
    on:mouseup={mouse_up_handler}
    on:mousemove={mouse_move_handler}
    on:touchstart={touch_start_handler}
    on:touchmove={touch_move_handler}
    on:touchend={touch_end_handler}
    bind:this={canvas} />

<style>
    canvas {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        margin: 0;
        padding: 0;
        z-index: -1;
    }
</style>
