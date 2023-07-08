interface appmount extends HTMLDivElement
{
    close: HTMLButtonElement;
    select: selectResource;
    segments: downloadSegments;
}
interface appmountConstructor extends RHU.Macro.Constructor<appmount>
{
    
}

interface selectResource extends HTMLDivElement
{
    reload(): void;
    filterOperation(): void;

    list: Map<Element, string>;
    additional: string[];

    table: HTMLTableElement;
    filter: HTMLInputElement;
    deep: HTMLButtonElement;
    refresh: HTMLButtonElement;
}
interface selectResourceConstructor extends RHU.Macro.Constructor<selectResource>
{
    
}

interface downloadSegments extends HTMLDivElement
{
    downloadMeta(): void;
    reload(url: string): void;
    parse(url: string, m3u8: string): void;
    download(i?: number): void;
    render(): void;

    segments: {
        name: string,
        duration: number,
        url: string
    }[];

    table: HTMLTableElement;
    url: HTMLInputElement;
    refresh: HTMLButtonElement;
    get: HTMLButtonElement;
    meta: HTMLButtonElement;
}
interface downloadSegmentsConstructor extends RHU.Macro.Constructor<downloadSegments>
{
    
}

declare namespace RHU { namespace Macro {
    interface TemplateMap
    {
        "appmount": appmount;
        "selectResource": selectResource;
        "downloadSegments": downloadSegments;
    }
}}

RHU.import(RHU.module({ trace: new Error(),
    name: "Main", hard: ["RHU.Macro"],
    callback: function()
    {
        /**
         * Compares the similarity between two strings using an n-gram comparison method. 
         * The grams default to length 2.
         * @param str1 The first string to compare.
         * @param str2 The second string to compare.
         * @param gramSize The size of the grams. Defaults to length 2.
         */
        function similar(str1: string, str2: string, gramSize: number = 2) {
            function getNGrams(s: string, len: number) {
            s = ' '.repeat(len - 1) + s.toLowerCase() + ' '.repeat(len - 1);
            let v = new Array(s.length - len + 1);
            for (let i = 0; i < v.length; i++) {
                v[i] = s.slice(i, i + len);
            }
            return v;
            }
        
            if (!str1?.length || !str2?.length) { return 0.0; }
        
            //Order the strings by length so the order they're passed in doesn't matter 
            //and so the smaller string's ngrams are always the ones in the set
            let s1 = str1.length < str2.length ? str1 : str2;
            let s2 = str1.length < str2.length ? str2 : str1;
        
            let pairs1 = getNGrams(s1, gramSize);
            let pairs2 = getNGrams(s2, gramSize);
            let set = new Set<string>(pairs1);
        
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
        
        let open: Function = window.XMLHttpRequest.prototype.open;
        let selectResource = function(this: selectResource)
        {
            this.list = new Map();
            this.additional = [];
            let additional = this.additional;
            window.XMLHttpRequest.prototype.open = function (method: string, url: string | URL)
            {
                additional.push(url.toString());
                open.call(this, ...arguments);
            }
         
            this.reload();
            this.deep.addEventListener("click", () => {
                let iframe = document.querySelector("iframe");
                if (RHU.exists(iframe))
                {
                    let a = document.createElement("a");
                    a.href = iframe.src;
                    a.click();
                }
                else alert("no iframe");
            });
            this.refresh.addEventListener("click", () => {
                this.reload();
            });
            this.filter.addEventListener("change", () => {
                this.filterOperation();
            });
        } as selectResourceConstructor;
        selectResource.prototype.filterOperation = function()
        {
            let filter = this.filter.value;
            let values = [...this.list];
            if (filter.trim() !== "")
            {
                values = values.sort((a, b) => {
                    return similar(b[1], filter) - similar(a[1], filter);
                }).splice(0, values.length < 10 ? values.length : 10);
            }
            let fragment = new DocumentFragment();
            for (let value of values)
            {
                fragment.append(value[0]);
            }
            this.table.replaceChildren(fragment);
            let computed = window.getComputedStyle(this.table);
            this.filter.style.width = `${parseInt(computed.width) - 40}px`;
        }
        selectResource.prototype.reload = function()
        {
            this.list.clear();
            let fragment = new DocumentFragment();
            let resources: string[] = [];
            for (let entry of performance.getEntriesByType("resource"))
                resources.push(entry.name);
            resources.push(...this.additional);
            for (let resource of resources)
            {
                let name = resource;
                let row = RHU.Macro.parseDomString(//html
                `
                    <tr>
                        <td>
                            <button style="border-radius: 4px; background-color: white; width: 30px; height: 30px; color: black;">+</button>
                        </td>
                        <td>
                            <span style="text-overflow: ellipsis; color: white;">${name}</span>
                        </td>
                    </tr>
                `
                ).children[0];
                let button = row.children[0].children[0] as HTMLButtonElement;
                button.addEventListener("click", () => {
                    mount.segments.reload(name);
                });
                this.list.set(row, name);
                fragment.append(row);
            }
            this.table.replaceChildren(fragment);
            let computed = window.getComputedStyle(this.table);
            this.filter.style.width = `${parseInt(computed.width) - 40}px`;

            this.filterOperation();
        };
        RHU.Macro(selectResource, "selectResource", //html
        `
            <div style="
            margin: 0px; 10px;
            ">
                <button style="color: black; border-radius: 4px; background-color: white; width: 30px; height: 30px;" rhu-id="deep">^</button>
                <button style="color: black; border-radius: 4px; background-color: white; width: 30px; height: 30px;" rhu-id="refresh">@</button>
                <input rhu-id="filter" style="color: black; border-radius: 4px; background-color: white; height: 30px;" type="text">
            </div>
            <table rhu-id="table" style="
            ">
            </table>
        `, {
            element: //html
            `<div style="
            color: white;
            padding: 10px;
            margin-top: 10px;
            border-top-style: solid;
            border-top-width: 1px;
            border-top-color: white;
            "></div>`
        });

        let downloadSegments = function(this: downloadSegments)
        {
            this.refresh.addEventListener("click", () => {
                this.reload(this.url.value);
            });
            this.get.addEventListener("click", () => {
                this.download();
            });
            this.meta.addEventListener("click", () => {
                this.downloadMeta();
            });
        } as downloadSegmentsConstructor;
        downloadSegments.prototype.reload = function(url)
        {
            this.url.value = url;

            fetch(url, {
                method: "GET",
            }).then(async (resp) => {
                if (resp.status === 200)
                {
                    let blob = await resp.blob();
                    let text = await blob.text();
                    this.parse(url, text);
                }
                else alert("Failed to GET 'index-s32.m3u8'");
            });
        };
        downloadSegments.prototype.downloadMeta = function()
        {
            if (this.url.value === "")
            {
                alert("No URL.");
                return;
            }

            fetch(this.url.value, {
                method: "GET",
            }).then(async (resp) => {
                if (resp.status === 200)
                {
                    let title = `m3u8 ${new Date()}`;
                    {
                        let blob = await resp.blob();
                        let blobURL = window.URL.createObjectURL(blob);
                        let a = document.createElement("a");
                        a.href = blobURL;
                        a.download = `${title}.m3u8`;
                        a.click();
                        window.URL.revokeObjectURL(blobURL);
                    }
                    {
                        let json = JSON.stringify({ url: this.url.value });
                        let blob = new Blob([json], { type: 'text/json' });
                        let url = window.URL.createObjectURL(blob);
                        let a = document.createElement("a");
                        a.href = url;
                        a.download = `${title}.json`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                    }
                }
                else alert("Failed to GET 'index-s32.m3u8'");
            });
        };
        downloadSegments.prototype.parse = function(url, m3u8)
        {
            this.segments = [];

            let lines = m3u8.split("\n");
            for (let i = 0; i < lines.length;)
            {
                let line = lines[i++];
                if (/#EXTINF/.test(line))
                {
                    let duration = parseFloat(line.split(":")[1]);
                    let partial = lines[i++];
                    let name = partial.split("?")[0];
                    let core = url.split(/\/index\-\w*\.m3u8/);
                    let full = `${core[0]}/${partial}`;
                    this.segments.push({
                        name: name,
                        duration: duration,
                        url: full
                    });
                }
            }
            
            this.render();
        };
        downloadSegments.prototype.render = function()
        {
            let fragment = new DocumentFragment();
            for (let segment of this.segments)
            {
                let row = RHU.Macro.parseDomString(//html
                `
                    <tr>
                        <td>
                            <button style="color: black; border-radius: 4px; background-color: white; width: 30px; height: 30px;">V</button>
                        </td>
                        <td>
                            <span style="text-overflow: ellipsis; color: white;">${segment.name}</span>
                        </td>
                        <td>
                            <span style="text-overflow: ellipsis; color: white;">${segment.duration}</span>
                        </td>
                    </tr>
                `
                ).children[0];
                let button = row.children[0].children[0] as HTMLButtonElement;
                button.addEventListener("click", () => {
                    fetch(segment.url, {
                        method: "GET",
                    }).then(async (resp) => {
                        if (resp.status === 200)
                        {    
                            let blob = await resp.blob();
                            let url = window.URL.createObjectURL(blob);
                            let a = document.createElement("a");
                            a.href = url;
                            a.download = `${segment.name}.ts`;
                            a.click();
                            window.URL.revokeObjectURL(url);
                        }
                        else alert(`Failed to GET segment '${segment.name}'`);
                    });
                });
                fragment.append(row);
            }
            this.table.replaceChildren(fragment);
            let computed = window.getComputedStyle(this.table);
            this.url.style.width = `${parseInt(computed.width) - 40}px`;
        };
        downloadSegments.prototype.download = function(i: number = 0)
        {
            if (!RHU.exists(this.segments) || this.segments.length === 0)
            {
                alert("No segments.");
                return;
            }

            fetch(this.segments[i].url, {
                method: "GET",
            }).then(async (resp) => {
                if (resp.status === 200)
                {    
                    let blob = await resp.blob();
                    let url = window.URL.createObjectURL(blob);
                    let a = document.createElement("a");
                    a.href = url;
                    a.download = `${this.segments[i].name}.ts`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    this.download(++i);
                }
                else alert(`Failed to GET segment '${this.segments[i].name}'`);
            });
        };
        RHU.Macro(downloadSegments, "downloadSegments", //html
        `
            <div style="
            margin: 0px; 10px;
            ">
                <button style="color: black; border-radius: 4px; background-color: white; width: 30px; height: 30px;" rhu-id="refresh">@</button>
                <button style="color: black; border-radius: 4px; background-color: white; width: 30px; height: 30px;" rhu-id="meta">M</button>
                <input rhu-id="url" style="color: black; background-color: white; border-radius: 4px; height: 30px;" type="text">
                <button style="color: black; border-radius: 4px; background-color: white; width: 30px; height: 30px;" rhu-id="get">V</button>
            </div>
            <table rhu-id="table" style="
            ">
            </table>
        `, {
            element: //html
            `<div style="
            color: white;
            padding: 10px;
            margin-top: 10px;
            border-top-style: solid;
            border-top-width: 1px;
            border-top-color: white;
            "></div>`
        });

        let appmount = function(this: appmount)
        {
            this.close.addEventListener("click", () => {
                this.style.display = "none";
                trigger.style.display = "block";
            });
        } as appmountConstructor;
        RHU.Macro(appmount, "appmount", //html
        `
            <!-- navbar -->
            <div style="
            margin: 0px; 10px;
            ">
                <button style="color: black; border-radius: 4px; background-color: white; width: 30px; height: 30px;" rhu-id="close">X</button>
            </div>
            <!-- content -->
            <rhu-macro rhu-id="select" rhu-type="selectResource"></rhu-macro>
            <rhu-macro rhu-id="segments" rhu-type="downloadSegments"></rhu-macro>
        `, {
            element: //html
            `<div style="
                width: 100%;
                height: 100%;
                overflow: auto;
                z-index: 9999;
                position: fixed;
                top: 0;
                left: 0;
                background-color: #202124;
                display: none;
            "></div>`
        });

        let mount = document.createMacro("appmount");
        document.body.append(mount);
        let trigger = RHU.Macro.parseDomString(//html
            `<button style="
                color: black; 
                border-radius: 4px; 
                background-color: white; 
                border-style: solid;
                border-color: black;
                border-width: 1px;
                z-index: 9999;
                position: fixed;
                right: 10px;
                bottom: 10px;
                padding: 10px;
            ">m3u8Scraper</button>`
            ).children[0] as HTMLButtonElement;
        trigger.addEventListener("click", () => {
            mount.style.display = "block";
            trigger.style.display = "none";
        });
        document.body.append(trigger);
    }
}));