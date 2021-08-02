<script>
    const screen_width = (window.innerWidth > 0) ? window.innerWidth : screen.width;

    let mobile = screen_width > 575 ? 0 : 1;

</script>

<main class:mobile class="d-flex justify-content-between">
    <div class="col-lg-4">
        <h2>édition print</h2>
        <p style=""><span>60% du C.A. / BtoB 40% :</span> animation réseau, presse interne,
            press spécialisée, édition financière, événementiel <span>/ BtoC 60% :</span>
            marketing direct, campagne global, édition commerciale, événementiel.
        </p>
        <p class="thin inlineadjust"><span>INTERNALISÉ</span> - Suivi de projet - Direction artistique - Graphisme -
        Illustration - Suivi et conseil en fabrication - Conseil en contenue et en communication /
        <span>EXTERNALISÉ</span> - Rédaction - Prise de vue - Imagerie 3D - Conseil en stratégie
            opérationnelle - Bureau de style - Achat Media - Pré-test / Post-test</p>
    </div>

    <div class="col-lg-4">
            <h2>packaging</h2>
            <p><span>25% du C.A.</span><br/>Identité produit, design porduit, solutions techniques,
                pré-test, post-test
            </p>
            <p class="thin inlineadjust">
                <span>INTERNALISÉ</span> - Suivi de projet - Direction artistique - Graphisme -
                Illustration - Suivi et conseil en fabrication - Conseil en contenue et en communication /
                <span>EXTERNALISÉ</span> - Rédaction - Prise de vue - Imagerie 3D - Conseil en stratégie
                opérationnelle - Bureau de style - Achat Media - Pré-test / Post-test
            </p>
        </div>

        <div class="col-lg-4">
            <h2>digital design</h2>
            <p class=""><span>15% du C.A.</span><br/>Site web, E-commerce, In-store technologies,
            sound design, motion design, Keynote & PowerPoint</p>
            <p class="thin"><span>INTERNALISÉ</span> - Suivi de projet - Direction artistique - Graphisme -
                Ergonomie - Motion design /
                <span>EXTERNALISÉ</span> - Integration - Developpement - Rédaction - Prise de vue - Imagerie 3D - Video - Formation -
            Achat média - Référencement</p>
        </div>
</main>

<style>
    .mobile {
        display: block;
    }
    main {
        display:-webkit-box;
        display:-webkit-flex;
        display:-ms-flexbox;
        display:flex;
        -webkit-flex-wrap:wrap;
        -ms-flex-wrap:wrap;
        flex-wrap:wrap;
        text-align: left;
        padding: 0.2em 0.4em 0.2em 0.2em;
        margin-top: 0;
        margin-left: 10px;
        margin-bottom: 0;
    }

    div {
        margin-top: 0;
        margin-bottom: 0;
    }

    span {
        color: rgba(250, 40, 40, 0.78);
    }
    h2 {
        font-family: aileronbold;
        margin-top: 0;
        margin-bottom: 5px;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.78);
        margin-right: 1px;
        font-size: 60px;
    }

    p {
        margin-top: 0;
        font-size: 24px;
        padding-bottom: 15px;
        color: rgba(0, 0, 0, 0.78);
        font-weight: 600;
    }

    .inlineadjust{
        /*width: 75%;*/
    }

    .thin {
        font-weight: 400;
    }

    @media screen and (max-width: 575px) {
        main{
            padding: 0;
        }
        div {
            width: 95%;
            font-size: 1.7em;
        }
        h2 {
            font-size: 2em;
        }
        p{
            inline-size: 100%;
            font-size: 0.7em;
        }

        .inlineadjust{
            inline-size: 100%;
        }
    }

    @media screen and (max-width: 321px) {
        div {
            width: 100%;
            font-size: 1.7em;
        }
        p{
            inline-size: 100%;
        }
        .inlineadjust{
            inline-size: 100%;
        }

    }

</style>