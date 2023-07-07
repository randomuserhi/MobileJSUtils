RHU.import(RHU.module({ trace: new Error(),
    name: "Main", hard: ["RHU.Macro"],
    callback: function () {
        function similar(str1, str2, gramSize = 2) {
            function getNGrams(s, len) {
                s = ' '.repeat(len - 1) + s.toLowerCase() + ' '.repeat(len - 1);
                let v = new Array(s.length - len + 1);
                for (let i = 0; i < v.length; i++) {
                    v[i] = s.slice(i, i + len);
                }
                return v;
            }
            if (!str1?.length || !str2?.length) {
                return 0.0;
            }
            let s1 = str1.length < str2.length ? str1 : str2;
            let s2 = str1.length < str2.length ? str2 : str1;
            let pairs1 = getNGrams(s1, gramSize);
            let pairs2 = getNGrams(s2, gramSize);
            let set = new Set(pairs1);
            let total = pairs2.length;
            let hits = 0;
            for (let item of pairs2) {
                if (set.delete(item)) {
                    hits++;
                }
            }
            return hits / total;
        }
        let { RHU } = window.RHU.require(window, this);
        let selectResource = function () {
            this.mount = this.parentElement;
            this.list = new Map();
            this.reload();
            this.refresh.addEventListener("click", () => {
                this.reload();
            });
            this.filter.addEventListener("change", () => {
                let filter = this.filter.value;
                let values = [...this.list].sort((a, b) => {
                    return similar(b[1], filter) - similar(a[1], filter);
                });
                let fragment = new DocumentFragment();
                for (let value of values) {
                    fragment.append(value[0]);
                }
                this.table.replaceChildren(fragment);
            });
        };
        selectResource.prototype.reload = function () {
            this.list.clear();
            let fragment = new DocumentFragment();
            let resources = performance.getEntriesByType("resource");
            for (let resource of resources) {
                let name = resource.name;
                let row = RHU.Macro.parseDomString(`
                    <tr>
                        <td>
                            <button style="width: 30px; height: 30px">+</button>
                        </td>
                        <td>
                            <span style="text-overflow: ellipsis; color: white;">${name}</span>
                        </td>
                    </tr>
                `).children[0];
                let button = row.children[0].children[0];
                button.addEventListener("click", () => {
                    this.mount.segments.reload(name);
                });
                this.list.set(row, name);
                fragment.append(row);
            }
            this.table.replaceChildren(fragment);
        };
        RHU.Macro(selectResource, "selectResource", `
            <div style="
            width: 100%;
            margin: 0px; 10px;
            ">
                <button style="width: 30px; height: 30px;" rhu-id="refresh">@</button>
                <input rhu-id="filter" style="height: 30px; width: 90%;" type="text">
            </div>
            <table rhu-id="table" style="
                width: 100%;
            ">
            </table>
        `, {
            element: `<div style="
            color: white;
            padding: 10px;
            width: 100%;
            margin-top: 10px;
            border-top-style: solid;
            border-top-width: 1px;
            border-top-color: white;
            "></div>`
        });
        let downloadSegments = function () {
            this.mount = this.parentElement;
            this.refresh.addEventListener("click", () => {
                this.reload(this.url.value);
            });
            this.get.addEventListener("click", () => {
                this.download();
            });
        };
        downloadSegments.prototype.reload = function (url) {
            this.url.value = url;
            fetch(url, {
                method: "GET",
            }).then(async (resp) => {
                if (resp.status === 200) {
                    let blob = await resp.blob();
                    let blobURL = window.URL.createObjectURL(blob);
                    let a = document.createElement("a");
                    a.href = blobURL;
                    a.download = `m3u8 ${new Date()}.m3u8`;
                    a.click();
                    let text = await blob.text();
                    this.parse(url, text);
                }
                else
                    alert("Failed to GET 'index-s32.m3u8'");
            });
        };
        downloadSegments.prototype.parse = function (url, m3u8) {
            this.segments = [];
            let lines = m3u8.split("\n");
            for (let i = 0; i < lines.length;) {
                let line = lines[i++];
                if (/#EXTINF/.test(line)) {
                    let duration = parseFloat(line.split(":")[1]);
                    let partial = lines[i++];
                    let name = partial.split("?")[0];
                    let full = `${url}/${partial}`;
                    this.segments.push({
                        name: name,
                        duration: duration,
                        url: full
                    });
                }
            }
            this.render();
        };
        downloadSegments.prototype.render = function () {
            let fragment = new DocumentFragment();
            for (let segment of this.segments) {
                let row = RHU.Macro.parseDomString(`
                    <tr>
                        <td>
                            <button style="width: 30px; height: 30px;">V</button>
                        </td>
                        <td>
                            <span style="text-overflow: ellipsis; color: white;">${segment.name}</span>
                        </td>
                        <td>
                            <span style="text-overflow: ellipsis; color: white;">${segment.duration}</span>
                        </td>
                    </tr>
                `).children[0];
                let button = row.children[0].children[0];
                button.addEventListener("click", () => {
                    fetch(segment.url, {
                        method: "GET",
                    }).then(async (resp) => {
                        if (resp.status === 200) {
                            let blob = await resp.blob();
                            let url = window.URL.createObjectURL(blob);
                            let a = document.createElement("a");
                            a.href = url;
                            a.download = `${segment.name}.ts`;
                            a.click();
                        }
                        else
                            alert(`Failed to GET segment '${segment.name}'`);
                    });
                });
                fragment.append(row);
            }
            this.table.replaceChildren(fragment);
        };
        downloadSegments.prototype.download = function (i = 0) {
            if (!RHU.exists(this.segments) || this.segments.length === 0) {
                alert("No segments.");
                return;
            }
            fetch(this.segments[i].url, {
                method: "GET",
            }).then(async (resp) => {
                if (resp.status === 200) {
                    let blob = await resp.blob();
                    let url = window.URL.createObjectURL(blob);
                    let a = document.createElement("a");
                    a.href = url;
                    a.download = `${this.segments[i].name}.ts`;
                    a.click();
                    this.download(++i);
                }
                else
                    alert(`Failed to GET segment '${this.segments[i].name}'`);
            });
        };
        RHU.Macro(downloadSegments, "downloadSegments", `
            <div style="
            width: 100%;
            margin: 0px; 10px;
            ">
                <button style="width: 30px; height: 30px;" rhu-id="refresh">@</button>
                <input rhu-id="url" style="height: 30px; width: 80%;" type="text">
                <button style="width: 30px; height: 30px;" rhu-id="get">V</button>
            </div>
            <table rhu-id="table" style="
                width: 100%;
            ">
            </table>
        `, {
            element: `<div style="
            color: white;
            padding: 10px;
            width: 100%;
            margin-top: 10px;
            border-top-style: solid;
            border-top-width: 1px;
            border-top-color: white;
            "></div>`
        });
        let appmount = function () {
            this.close.addEventListener("click", () => {
                this.style.display = "none";
                trigger.style.display = "block";
            });
        };
        RHU.Macro(appmount, "appmount", `
            <!-- navbar -->
            <div style="
            width: 100%;
            margin: 0px; 10px;
            ">
                <button style="width: 30px; height: 30px;" rhu-id="close">X</button>
            </div>
            <!-- content -->
            <rhu-macro rhu-id="select" rhu-type="selectResource"></rhu-macro>
            <rhu-macro rhu-id="segments" rhu-type="downloadSegments"></rhu-macro>
        `, {
            element: `<div style="
                z-index: 9999;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                background-color: #202124;
                display: none;
            "></div>`
        });
        let mount = document.createMacro("appmount");
        document.body.append(mount);
        let trigger = RHU.Macro.parseDomString(`<button style="
                z-index: 9999;
                position: absolute;
                right: 10px;
                bottom: 10px;
                padding: 10px;
            ">m3u8Scraper</button>`).children[0];
        trigger.addEventListener("click", () => {
            mount.style.display = "block";
            trigger.style.display = "none";
        });
        document.body.append(trigger);
    }
}));
