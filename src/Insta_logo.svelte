<script>
    import { onMount } from 'svelte';

    let canvas;

    onMount(() => {
        const ctx = canvas.getContext('2d');
        let frame;

        (function loop() {
            frame = requestAnimationFrame(loop);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            for (let p = imageData.data.length; p > 0; p -= 4) {
                const i = p / 4;
                const x = i % canvas.width;
                const y = i / canvas.height >>> 0;

                const t = window.performance.now();

                const r = 64 + (128 * x / canvas.width) + (128 * Math.sin(t / 1000));
                const g = 64 + (128 * y / canvas.height) + (128 * Math.cos(t / 1400));
                const b = 128;

                imageData.data[p + 0] = r;
                imageData.data[p + 1] = g;
                imageData.data[p + 2] = b;
                imageData.data[p + 3] = 178;
            }

            ctx.putImageData(imageData, 0, 0);
        }());

        return () => {
            cancelAnimationFrame(frame);
        };
    });
</script>
<div>
<canvas
        bind:this={canvas}
        width={32}
        height={32}
        on:click={() =>{window.open("https://www.instagram.com/instabodotika/");}}
></canvas>
</div>
<style>
    div{
        width: 150px;
        height: 85px;


    }
    canvas {
        width: 100%;
        cursor: pointer;
        height: 100%;
        background-color: #666;
        -webkit-mask: url(instagram-ar21.svg) 50% 50% no-repeat;
        mask: url(instagram-ar21.svg) 50% 50% no-repeat;
    }
</style>