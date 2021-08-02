<script>
    import { slide } from 'svelte/transition';
    import { expoIn, expoOut } from 'svelte/easing';
    import { fly } from 'svelte/transition';
    import { fade } from 'svelte/transition';
    import Insta_logo from './Insta_logo.svelte';

    let clicked = false;
    let copied = false;

    const str = "bonjour@bodotika.fr";
    const screen_width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
    const copied_msg = screen_width > 575 ? "\"bonjour@bodotika.fr\" a été copié dans votre presse-papiers."
        : "\"bonjour@bodotika.fr\" a été copié avec succès."

    const copyToClipboard = str => {
        const el = document.createElement('textarea');
        el.value = str;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        const selected = document.getSelection().rangeCount > 0 ?
            document.getSelection().getRangeAt(0) : false;
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        if (selected) {
            document.getSelection().removeAllRanges();
            document.getSelection().addRange(selected);
        }
    };

    function On_copie(){
        if (copied) return;

        copied = !copied;
        copyToClipboard(str);

        setTimeout(() => {
            copied = !copied;
        }, 2500);
    }

</script>

<main>
    {#if screen_width > 575}
        <div class="align-items-center contain">
            <div class="title col-auto mr-auto">
                <h1 class=""><span>Bodotika</span><span>Bureau de création et d'édition _
                </span><span>Avignon <b style="font-weight: 500; color: rgba(0, 0, 0, 0.78); font-size: 11px;">/</b> Saint-Etienne</span></h1>
            </div>
            <div class="col-auto d-flex align-items-center">
                <Insta_logo/>
                <span class="underline" style="font-size: 14px; font-weight: 500;"
                      on:click={On_copie}>Contact</span>
            </div>
        </div>

    {:else}
        <div class="container" style="padding-bottom: 0">
            <div class="row align-items-center">
                <div class="title col">
                    <h1><span>Bodotika</span><span>Bureau de création et d'édition</span></h1>
                </div>
                <div class="col MobileMenu">
                    <span class="icon" on:click={() => {clicked = !clicked}}>
                        <i class="fa fa-bars"></i>
                    </span>
                </div>
            </div>
            {#if clicked}
                <div class="row MobileRow py-3" in:slide="{{delay: 0, duration: 500, easing: expoOut }}"
                     out:slide="{{delay: 0, duration: 250, easing: expoIn }}">
                    <div class="MobileLinks col" style="text-align: left;">
                        <span on:click={On_copie}>Contact</span>
                    </div>
                    <span style="line-height: 1; font-size: 15px; color:rgba(0, 0, 0, 0.88);">|</span>
                    <div class="MobileLinks col" style="text-align: right;">
                        <span on:click={() =>{window.open("https://www.instagram.com/instabodotika/");}}>
                            Instagram</span>
                    </div>
                </div>
            {/if}
        </div>
    {/if}
    {#if copied}
            <div class="copied align-self-end" in:fly="{{y: 200, duration: 1000}}"
                 out:fade="{{duration: 500, delay: 500}}">
                <p style="text-align: justify;">{copied_msg}</p>
            </div>
    {/if}


</main>

<style>

    .underline:hover {
        text-decoration: underline;
        cursor: pointer;
    }
    .copied {
        padding: 1.7em 1em 1em 1em;
        color: white;
        background: rgba(0, 0, 0, 0.88);
        border-radius: 10px;
        z-index: 1000;
        position: fixed;
        bottom: 2em;
        right: 3em;
    }

    .contain{
        display: flex;
        padding-right: 1em;
    }

    i {
        font-size: 25px;
    }

    .MobileRow {
        margin-top: 10px;
        border-radius: 7px;
        margin-right: -3px;
    }

    .MobileLinks {
        padding-right: 0;
        padding-left: 0em;
        color: rgba(0, 0, 0, 0.88);
        font-size: 14px;
        font-weight: 500;
    }
    .MobileMenu {
        text-align: right;
        position: absolute;
    }

    main {
        margin-left: 7px;
        margin-right: 7px;
        padding: 0.3em;
        padding-top: 0;
        margin-bottom: 30px;
    }

    .title {
        display: block;
        vertical-align: bottom;
        text-align: left;
    }

    h1>span:nth-child(even)
    {
        font-size: 14px;
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
            padding-left: 0;
            margin-bottom: 0px;
        }

        h1>span:nth-child(1){
            font-size: 20px;
        }

        h1>span:nth-child(2){
            font-size: 10px;
        }
        .copied {
            width: 100%;
            border-radius: 0;
            bottom: -1px;
            left: 0;
        }
    }

    @media screen and (max-width: 321px) {
        h1>span:nth-child(1){
            font-size: 18px;
        }

        h1>span:nth-child(2){
            font-size: 8px;
        }

        i {
            font-size: 25px;
        }
        .copied {
            width: 100%;
            font-size: 12px;
            border-radius: 0;
            bottom: -1px;
            left: 0;
        }
    }

    @media screen and (max-width: 281px) {
        h1>span:nth-child(1){
            font-size: 16px;
        }

        h1>span:nth-child(2){
            font-size: 7px;
        }

        i {
            font-size: 25px;
        }
        .copied {
            width: 100%;
            font-size: 10px;
            border-radius: 0;
            bottom: -1px;
            left: 0;
        }
    }

</style>