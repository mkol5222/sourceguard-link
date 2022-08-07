console.log("SourceGuard content script active for ", document.location.href);

function getRepoLink(lineObj)
{
  // remove .git from end
  const normalizedRepository = lineObj.repository.replace(
    /\.git$/,
    ""
  );

  // remove repo name from file path
  const normalizedFilepath = lineObj.file.replace(/^[^/]+\//,'')


  const link = `https://${normalizedRepository}/blob/master/${normalizedFilepath}#L${lineObj.line}`;

  return link;
}

function getRepository() {
  let repo = "n/a";
  const scanDetailHeaders = [
    ...document.getElementsByClassName("scan-header-section2"),
  ];
  if (scanDetailHeaders && scanDetailHeaders.length > 0) {
    repo = scanDetailHeaders[0].childNodes[3].innerText;
  }
  return repo;
}
function makeRepoLineLinskClickable(event) {
  // repo name
  const repo = getRepository();

  // findings summary table
  const tables = [...document.getElementsByClassName("rt-tbody")];
  if (tables && tables.length > 0) {
    const firstTable = tables[0];

    // take table row by row
    for (const line of firstTable.childNodes) {
      const columns = [...line.childNodes[0].childNodes];

      // there is more than one finding per table row(line)
      const findings = columns[2].innerText.split("\n");
      const lines = columns[3].innerText.split("\n");
      const lineDivs = [...columns[3].childNodes[0].childNodes];

      // make line numbers look like HTML links
      lineDivs.map(d => {
        d && (d.style.color = "blue") && (d.style.textDecoration = "underline")
        return d;
      });

      // each finding of table row
      for (const [i, finding] of findings.entries()) {

        // there might be more than one finding per row
        if (lines[i]) {
        
          // inputs to calculate target link
          const lineObj = {
            repository: repo,
            file: columns[0].innerText,
            line: lines[i].split(",")[0],
            finding,
          };

          console.log("setting on click for ", lineObj, lineDivs[i]);
          if (lineDivs && lineDivs[i]) {

            lineDivs[i].onclick = (event) => {

              console.log("finding clicked", lineObj);

              const link = getRepoLink(lineObj);
              
              console.log("link", link);
              window.open(
                link, "_blank");
            };
          }
        }
      }
    }
  }
}

// we are focusing on page rendering by ReactJS
function nodeInsertedCallback(event) {
  // page recreated?
  if (event.target.tagName === "MAIN") {
    // give React some time?
    setTimeout(makeRepoLineLinskClickable, 2500);
  }
}

// work only on SCAN RESULT page of SourceGuard
const pageUrl = document.location.href;
// https://portal.checkpoint.com/Dashboard/sourceguard#/scan/sourcecode/64de08445c34854becb6caf2b637906e7782872a35835817005c92c044148bbb-LQv59o
const scanUrlRegex =
  /https:\/\/portal\.checkpoint.com\/dashboard\/sourceguard#\/scan\/sourcecode\/([a-zA-Z0-9\-]+)$/;
const urlMatch = pageUrl.match(scanUrlRegex);
if (urlMatch) {
  console.log("SourceGuard scan URL matched", urlMatch, urlMatch[1]);
  // trigger page update on DOM manipulations by React
  document.addEventListener("DOMNodeInserted", nodeInsertedCallback);
}
