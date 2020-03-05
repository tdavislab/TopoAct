function toggleSimHighlight() {
    try {
        let checkbox = d3.select('#sim-highlight-chkbox');
        console.log(checkbox.node().checked);
    } catch (e) {
        console.log(e);
    }
}
