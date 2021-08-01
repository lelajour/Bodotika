<script>
    import Instafeed from "instafeed.js";

    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    const obs_padding = new MutationObserver(function() {
        const imgs_id = document.querySelectorAll('#img');

        for (let i = 0; i < imgs_id.length; i++) {
            if ((i % 3) === 1) {
                imgs_id.item(i).classList.add("middle_img");
            }
            else if ((i % 3) === 0) {
                imgs_id.item(i).classList.add("left_img");
            }
            else {
                imgs_id.item(i).classList.add("right_img");
            }
        }
    });

    document.addEventListener("DOMContentLoaded", () => {
        const feed = new Instafeed({
            accessToken: 'IGQVJWOGdHMThGWkN3bkdDblpGODBSMG9PUjVnNkhELVJtazBOTUVQeGozbGJ3TU5mUTNsZAlJtMWxoNjFqaFE3Mmp2cW9hVHNoaklJd1ZARYlhaWUF0eXlNbFFpMEhKYXlZAZAUYybmpBTnM3X2ROMTJHeQZDZD',
            template: '<div id="col" class="list-item py-4 col-sm-4 d-flex flex-wrap justify-content-sm-between"><a href="{{link}}" target="_blank"><img id="img" alt="{{caption}}" title="{{caption}}" src="{{image}}" class="img-fluid img"/></a></div>',
            resolution: 'standard_resolution',
            sortBy: 'most-recent',
            limit: 9
        });
        feed.run();

        const row = document.querySelector('.row');
        obs_padding.observe(row, {
            childList: true,
            subtree: true
        });
    });
</script>

<main>
    <div class="contain">
        <div id="instafeed" class="row"></div>
    </div>
</main>

<style>
    main {
        padding: -1.5em;
    }

    .row {
        padding: 0;
    }

    .contain{
        width: 100%;
        padding: 0;
    }
</style>