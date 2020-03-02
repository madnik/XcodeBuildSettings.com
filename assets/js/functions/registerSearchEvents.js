//= require ../vendor/lunr

function filterResultsForQuery(query) {
  if (!query) {
    requestAnimationFrame(() => {
      document.body.classList.remove("filtered");

      document
        .querySelectorAll(
          "main article, nav li, section, section section > ul > li"
        )
        .forEach(element => {
          element.hidden = false;
        });
    });
  } else {
    const results = window.search_index.search(query);

    document.body.classList.add("filtered");
    const counter = document.querySelector("#number-of-results");
    counter.textContent = results.length;
    counter.dataset.value = results.length;

    document.querySelector("#query").textContent = query;

    if (results.length > 0) {
      requestAnimationFrame(() => {
        document.querySelector("main article").hidden = false;

        document
          .querySelectorAll("section section > ul > li")
          .forEach(element => {
            element.hidden = true;
          });

        results.forEach(result => {
          const term = document.getElementById(result.ref.toLowerCase());
          if (term) {
            term.hidden = false;
          }
        });

        document.querySelectorAll("article > section").forEach(section => {
          const hasVisibleTerms =
            section.querySelectorAll("section > ul > li:not([hidden])").length >
            0;
          section.hidden = !hasVisibleTerms;
          document.querySelector(
            `a[href$="${section.id}"]`
          ).parentElement.hidden = !hasVisibleTerms;
        });
      });
    } else {
      document.querySelectorAll("main article, nav li").forEach(element => {
        element.hidden = true;
      });
    }
  }
}

function registerSearchEvents() {
  window.search_index = lunr(function() {
    this.ref("key");
    this.field("name");

    document
      .querySelectorAll("section section > ul > li > header")
      .forEach(term => {
        this.add({
          key: term.querySelector("code").textContent,
          name: term.querySelector(".name").textContent
        });
      });
  });

  const callback = event => {
    const query = event.target.value;
    filterResultsForQuery(query);
  };

  document.querySelector("#search input").addEventListener("search", callback);
  document.querySelector("#search input").onkeyup = callback;

  let template = document
    .querySelector("template#search-results")
    .content.cloneNode(true);
  document.querySelector("main").prepend(template);
}
