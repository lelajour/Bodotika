<script>
    import {slide} from 'svelte/transition';

    export let clicked;
</script>

<svelte:window on:keydown={(e) => {if (e.key === "Escape") clicked = !clicked;}}/>

<main transition:slide={{duration: 700}}>
    <div class="align-items-center cont">
        <div class="titleml col-auto mr-auto">
            <h1 class=""><span>Bodotika</span><span>Bureau de création et d'édition _
                </span><span>Avignon <b style="font-weight: 500; color: rgba(0, 0, 0, 0.78); font-size: 11px;">/</b> Saint-Etienne</span></h1>
        </div>
        <div class="titlelink col-auto d-flex align-items-center">
            <i class="fa fa-times" aria-hidden="true" on:click={() => {clicked = !clicked;}}></i>
        </div>
    </div>
    <div class="container" style="padding-top: 4em;">
        <h1>MENTIONS LEGALES :</h1>

        <p style="text-align:justify"><strong> </strong><br />
            Conformément aux dispositions des articles 6-III et 19 de la Loi n° 2004-575 du 21 juin 2004 pour la Confiance dans l'économie numérique, dite L.C.E.N., nous portons à la connaissance des utilisateurs et visiteurs du site : <a href="http://www.bodotika.fr" target="_blank">www.bodotika.fr</a> les informations suivantes :</p>

        <p style="text-align:justify"><strong>ÉDITEUR</strong></p>

        <p style="text-align:justify">Le site <a href="http://www.bodotika.fr" style="color: rgb(7, 130, 193); font-family: sans-serif, Arial, Verdana; " target="_blank">www.bodotika.fr</a> est la propriété exclusive de <strong>SAS </strong><strong>Bodotika</strong>, qui l'édite.</p>

        <p style="text-align:justify"><strong>Bodotika</strong><strong> </strong><br />
            <strong>SAS </strong>au capital de<strong> </strong><strong>1000 </strong>€ Tél  : <strong>0677413261</strong></p>

        <p style="text-align:justify"><strong>ALLEZ LES NOUILLES, 3 RUE JACQUES CONSTANT MILLERET 42000 SAINT-ETIENNE </strong><strong>42000 Saint-Étienne</strong><br />
            Immatriculée au Registre du Commerce et des Sociétés de  <strong>Saint-Etienne B 492 193 586 </strong>sous le numéro<strong> </strong><strong>49219358600038</strong><strong> </strong></p>

        <p style="text-align:justify">Numéro TVA intracommunautaire : <strong>FR16492193586</strong><br />
            Adresse de courrier électronique : <strong>bonjour@bodotika.fr</strong> <br />
             <br />
            Directeur de la  publication : <strong>Thomas Lajournade</strong><br />
            Contactez le responsable de la publication : <strong>bonjour@bodotika.fr</strong></p>

        <p style="text-align:justify"> </p>

        <p style="text-align:justify"><strong>HÉBERGEMENT</strong></p>

        <p style="text-align:justify">Le site est hébergé par <strong>1&1 IONOS SE Ernst-Frey Strasse 9 76135 KARLSRUHE</strong><br />
            <u><strong>CREDITS :</strong></u> les mentions légales ont étés générées par <strong><a href="https://www.generer-mentions-legales.com">mentions légales</a></strong><br />
            Horaires de la <strong><a href="http://www.patinoire.biz/p+patinoire-de-lyon---charlemagne+113.html">Patinoire Lyon</a></strong></p>

        <p style="text-align:justify"> </p>

        <p style="text-align:justify"><strong>DESCRIPTION DES SERVICES FOURNIS</strong></p>

        <p style="text-align:justify">Le site <a href="http://www.bodotika.fr" style="text-align: justify;" target="_blank">www.bodotika.fr</a> a pour objet de fournir une information concernant l’ensemble des activités de la société. Le proprietaire du site s’efforce de fournir sur le site <a href="http://www.bodotika.fr" style="text-align: justify;" target="_blank">www.bodotika.fr</a> des informations aussi précises que possible. Toutefois, il ne pourra être tenue responsable des omissions, des inexactitudes et des carences dans la mise à jour, qu’elles soient de son fait ou du fait des tiers partenaires qui lui fournissent ces informations. Tous les informations proposées sur le site <a href="http://www.bodotika.fr" style="text-align: justify;" target="_blank">www.bodotika.fr</a> sont données à titre indicatif, sont non exhaustives, et sont susceptibles d’évoluer. Elles sont données sous réserve de modifications ayant été apportées depuis leur mise en ligne.  </p>

        <p><strong>PROPRIÉTÉ INTELLECTUELLE ET CONTREFAÇONS</strong></p>

        <p>Le proprietaire du site est propriétaire des droits de propriété intellectuelle ou détient les droits d’usage sur tous les éléments accessibles sur le site, notamment les textes, images, graphismes, logo, icônes, sons, logiciels… Toute reproduction, représentation, modification, publication, adaptation totale ou partielle des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable à l'email : bonjour@bodotika.fr  . Toute exploitation non autorisée du site ou de l’un quelconque de ces éléments qu’il contient sera considérée comme constitutive d’une contrefaçon et poursuivie conformément aux dispositions des articles L.335-2 et suivants du Code de Propriété Intellectuelle.  </p>

        <p><strong>LIENS HYPERTEXTES ET COOKIES</strong></p>

        <p>Le site <a href="http://www.bodotika.fr" style="text-align: justify;" target="_blank">www.bodotika.fr</a> contient un certain nombre de liens hypertextes vers d’autres sites (partenaires, informations …) mis en place avec l’autorisation de le proprietaire du site . Cependant, le proprietaire du site n’a pas la possibilité de vérifier le contenu des sites ainsi visités  et décline donc toute responsabilité de ce fait quand aux risques éventuels de contenus illicites. L’utilisateur est informé que lors de ses visites sur le site <a href="http://www.bodotika.fr" style="text-align: justify;" target="_blank">www.bodotika.fr</a>, un ou des cookies sont susceptible de s’installer automatiquement sur son ordinateur. Un cookie est un fichier de petite taille, qui ne permet pas l’identification de l’utilisateur, mais qui enregistre des informations relatives à la navigation d’un ordinateur sur un site. Les données ainsi obtenues visent à faciliter la navigation ultérieure sur le site, et ont également vocation à permettre diverses mesures de fréquentation. Le paramétrage du logiciel de navigation permet d’informer de la présence de cookie et éventuellement, de refuser de la manière décrite à l’adresse suivante : www.cnil.fr Le refus d’installation d’un cookie peut entraîner l’impossibilité d’accéder à certains services. L’utilisateur peut toutefois configurer son ordinateur de la manière suivante, pour refuser l’installation des cookies : Sous Internet Explorer : onglet outil / options internet. Cliquez sur Confidentialité et choisissez Bloquer tous les cookies. Validez sur Ok. Sous Netscape : onglet édition / préférences. Cliquez sur Avancées et choisissez Désactiver les cookies. Validez sur Ok.  </p>

        <p><strong>PROTECTION DES BIENS ET DES PERSONNES - GESTION DES DONNÉES PERSONNELLES</strong></p>

        <p>Utilisateur : Internaute se connectant, utilisant le site susnommé : <a href="http://www.bodotika.fr" style="text-align: justify;" target="_blank">www.bodotika.fr</a> En France, les données personnelles sont notamment protégées par la loi n° 78-87 du 6 janvier 1978, la loi n° 2004-801 du 6 août 2004, l'article L. 226-13 du Code pénal et la Directive Européenne du 24 octobre 1995.</p>

        <p>Sur le site <a href="http://www.bodotika.fr" style="text-align: justify;" target="_blank">www.bodotika.fr</a>, le proprietaire du site ne collecte des informations personnelles relatives à l'utilisateur que pour le besoin de certains services proposés par le site <a href="http://www.bodotika.fr" style="text-align: justify;" target="_blank">www.bodotika.fr</a>. L'utilisateur fournit ces informations en toute connaissance de cause, notamment lorsqu'il procède par lui-même à leur saisie. Il est alors précisé à l'utilisateur du site <a href="http://www.bodotika.fr" style="text-align: justify;" target="_blank">www.bodotika.fr</a> l’obligation ou non de fournir ces informations. Conformément aux dispositions des articles 38 et suivants de la loi 78-17 du 6 janvier 1978 relative à l’informatique, aux fichiers et aux libertés, tout utilisateur dispose d’un droit d’accès, de rectification, de suppression et d’opposition aux données personnelles le concernant. Pour l’exercer, adressez votre demande à <a href="http://www.bodotika.fr" style="text-align: justify;" target="_blank">www.bodotika.fr</a> par email : email du webmaster ou  en effectuant sa demande écrite et signée, accompagnée d’une copie du titre d’identité avec signature du titulaire de la pièce, en précisant l’adresse à laquelle la réponse doit être envoyée.</p>

        <p>Aucune information personnelle de l'utilisateur du site <a href="http://www.bodotika.fr" style="text-align: justify;" target="_blank">www.bodotika.fr</a> n'est publiée à l'insu de l'utilisateur, échangée, transférée, cédée ou vendue sur un support quelconque à des tiers. Seule l'hypothèse du rachat du site <a href="http://www.bodotika.fr" style="text-align: justify;" target="_blank">www.bodotika.fr</a> à le proprietaire du site et de ses droits permettrait la transmission des dites informations à l'éventuel acquéreur qui serait à son tour tenu de la même obligation de conservation et de modification des données vis à vis de l'utilisateur du site <a href="http://www.bodotika.fr" style="text-align: justify;" target="_blank">www.bodotika.fr</a>.</p>

        <p>Le site <a href="http://www.bodotika.fr" style="text-align: justify;" target="_blank">www.bodotika.fr</a> est en conformité avec le RGPD voir notre politique RGPD  www.no-cookies.thx.</p>

        <p>Les bases de données sont protégées par les dispositions de la loi du 1er juillet 1998 transposant la directive 96/9 du 11 mars 1996 relative à la protection juridique des bases de données.</p>

    </div>
</main>

<style>
    main {
        padding: 1em 2em 2em 2em;
        position: fixed;
        bottom: 0;
        overflow-y:scroll;
        left: 0;
        height: 100vh;
        width: 100vw;
        background: rgba(255, 255, 255, 1);
    }

    .titleml {
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

    .cont{
        display: flex;
        padding-right: 1em;
    }

    i {
        font-size: 20px;
        cursor: pointer;
    }

</style>