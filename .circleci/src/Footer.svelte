<script>
    import MentionLegales from "./MentionLegales.svelte";

    let clicked = false;

</script>

<main>

    {#if clicked}
        <MentionLegales bind:clicked/>
    {/if}

    <div class="title">
        <h1>
            <span>Bodotika</span><span>Bureau de création et d'édition _ </span><span>Avignon
            <b style="font-weight: 500; color: rgba(0, 0, 0, 0.78); font-size: 11px;">/</b> Saint-Etienne</span><span>_
            <span class="mt" on:click={() => {if (clicked) return; clicked = !clicked;}}>Mentions Legales</span> _
            Notre site ne collecte pas d’informations et
            n’utilise pas de cookies.</span>
        </h1>
    </div>
</main>

<style>

    .mt:hover {
        text-decoration: underline;
        cursor: pointer;
    }


    main {
        margin-left: 10px;
        margin-bottom: 50px;
        margin-top: 60px;
    }

    .title {
        text-align: center;
        background: transparent;
        float: left;
    }

    h1>span:nth-child(even)
    {
        color: rgba(0, 0, 0, 0.78);
        font-size: 14px;
        font-size-adjust: 0.1;
        font-weight: 500;
    }

    h1>span:nth-child(odd)
    {
        font-weight: 100;
        font-size-adjust: 0.1;
        color: rgba(0, 0, 0, 0.5);
        font-size: 12px;
        margin-left: 1px;
        margin-right: 7px;
        text-transform: uppercase;
    }

    h1>span:nth-child(1){
        font-size: 24px;
        color: rgba(0, 0, 0, 0.78);
        font-weight: 800;
    }

    @media screen and (max-width: 575px) {
        main {
            display: none;
        }
    }
</style>