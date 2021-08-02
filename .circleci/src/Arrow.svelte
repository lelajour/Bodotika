<script>
</script>

<main>
    <span class="arrow">&#x2192;</span>
</main>

<style>
    main {
        height: 9%;
        display: flex;
        padding: 0.3em;
        margin-left: 10px;
        margin-bottom: 0;
    }

    .arrow {
        padding: 0;
        margin-bottom: 0;
        display: inline-block;
        font-size: 65px;
        color: rgba(0, 0, 0, 0.78);
        font-weight: 700;
        transform: rotateZ(45deg);
    }

    @media screen and (max-width: 575px) {
        main {
            height: 60px;
        }
       .arrow {
           font-size: 55px;
           line-height: 1.3;
       }
    }

    @media screen and (max-width: 321px) {

    }

</style>