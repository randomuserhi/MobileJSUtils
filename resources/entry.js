(function () {
    if (!window.performance) {
        alert("window.performance not found.");
        return;
    }
    else if (!window.performance.getEntriesByType) {
        alert("window.performance not found.");
        return;
    }
    let entries = performance.getEntriesByType("resource");
    let names = [];
    for (let entry of entries) {
        names.push(entry.name);
    }
    let json = JSON.stringify(names);
    let blob = new Blob([json], { type: 'text/json' });
    let url = window.URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = `resources ${new Date()}.json`;
    a.click();
    URL.revokeObjectURL(url);
})();
