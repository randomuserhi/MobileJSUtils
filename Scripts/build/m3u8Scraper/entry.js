(function () {
    let cdn = `https://randomuserhi.github.io/HobbyProj/MobileUtils`;
    let util = {
        package: "m3u8Scraper",
        files: [
            "main.js"
        ],
        RHU: `RHU.config = {
    modules: ["macro", "event", "weak"],
    extensions: ["bezier"]
};`
    };
    let err = (e) => {
        alert(`Failed to import ${util.package}.`);
        let json = JSON.stringify({ package: util.package, error: { message: e.message, stack: e.stack } });
        let blob = new Blob([json], { type: 'text/json' });
        let url = window.URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = `${util.package} ${new Date()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
    };
    try {
        let load = () => {
            for (let file of util.files) {
                let script = document.createElement("script");
                script.src = `${cdn}/${util.package}/${file}`;
                script.onerror = () => {
                    err(new Error(`Failed to load ${file}.`));
                };
                document.body.append(script);
            }
        };
        if (util.RHU !== undefined && util.RHU !== null) {
            let config = document.createElement("script");
            config.type = "text/x-rhu-config";
            config.innerHTML = util.RHU;
            document.body.append(config);
            let script = document.createElement("script");
            script.src = `${cdn}/js3party/RHU/RHU.js`;
            script.onerror = () => {
                err(new Error(`Failed to load RHU.`));
            };
            script.onload = load;
            document.body.append(script);
        }
        else
            load();
    }
    catch (e) {
        err(e);
    }
})();
