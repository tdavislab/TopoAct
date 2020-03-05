var awesomplete_inst = new Awesomplete(document.getElementById("searchbox"), {minChars: 1, maxItems: 20});
var labels;

function array_intersect() {
    var a, b, c, d, e, f, g = [], h = {}, i;
    i = arguments.length - 1;
    d = arguments[0].length;
    c = 0;
    for (a = 0; a <= i; a++) {
        e = arguments[a].length;
        if (e < d) {
            c = a;
            d = e
        }
    }
    for (a = 0; a <= i; a++) {
        e = a === c ? 0 : a || c;
        f = arguments[e].length;
        for (var j = 0; j < f; j++) {
            var k = arguments[e][j];
            if (h[k] === a - 1) {
                if (a === i) {
                    g.push(k);
                    h[k] = 0
                } else {
                    h[k] = a
                }
            } else if (a === 0) {
                h[k] = 0
            }
        }
    }
    return g
}

function getColor(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name);
}

function buildLayers() {
    function layerBtnClicked(data) {
        // get clicked layer name
        let layers = ["3a", "3b", "4a", "4b", "4c", "4d", "4e", "5a", "5b"];
        let curr_layer = data.slice(-2);
        if (curr_layer === '3a') curr_layer = '3b';
        if (curr_layer === '5b') curr_layer = '5a';
        let prev_layer = layers[layers.indexOf(curr_layer) - 1];
        let next_layer = layers[layers.indexOf(curr_layer) + 1];

        // First set all layer-buttons to unselected
        d3.selectAll("div.layer-button").classed("selected", false);

        // Then set prev, curr and next layers to selected
        d3.select("#mixed" + prev_layer).classed("selected", true);
        d3.select("#mixed" + curr_layer).classed("selected", true);
        d3.select("#mixed" + next_layer).classed("selected", true);

        let layerDiv = d3.select(d3.event.target);
        layerDiv.classed("selected", true);

        draw_helper();
    }

    try {
        let layers = ["3a", "3b", "4a", "4b", "4c", "4d", "4e", "5a", "5b"];

        let layer_div = d3.select("div#toolbar-layer-list");
        layer_div.selectAll("div.layer-button")
            .data(layers)
            .enter()
            .append("div")
            .attr("id", d => "mixed" + d)
            .attr("class", "layer-button")
            .classed("selected", d => ["3a", "3b", "4a"].includes(d))
            .html(d => d)
            .attr("title", d => "mixed" + d)
            .on('click', layerBtnClicked);

        let glyph_div = layer_div.append("div")
            .style("margin", "30px");

        glyph_div.append("input")
            .attr("type", "checkbox")
            .style("display", "inline-block")
            .attr("title", "Overlay average activation image for each node on the graph")
            .attr("id", "node-glyph-checkbox");

        glyph_div.append("label")
            .attr("for", "node-glyph-checkbox")
            .attr("title", "Overlay average activation image for each node on the graph")
            .html("Show activation images");

        d3.select("#node-glyph-checkbox").on("change", function () {
            let glyph_checkbox = d3.select("#node-glyph-checkbox");
            if (glyph_checkbox.property("checked")) {
                d3.selectAll(".node-glyph").attr("visibility", "visible");
            } else {
                d3.selectAll(".node-glyph").attr("visibility", "hidden");
            }
        })
        // Set 3a as default selected layer
    } catch (e) {
        console.log(e)
    }
}

function buildDatasetDropdown() {
    function datasetChanged() {
        draw_helper();
    }

    try {
        let datasets = [
            {name: "Overlap-20-Epsilon-Fixed", value: "overlap-20"},
            {name: "Overlap-30-Epsilon-Fixed", value: "overlap-30"},
            {name: "Overlap-50-Epsilon-Fixed", value: "overlap-50"},
            {name: "Overlap-20-Epsilon-Adaptive", value: "overlap-20-eps"},
            {name: "Overlap-30-Epsilon-Adaptive", value: "overlap-30-eps"},
            {name: "Overlap-50-Epsilon-Adaptive", value: "overlap-50-eps"},
        ];

        let dropdown = d3.select("#dataset-selector");
        dropdown.selectAll("option")
            .data(datasets)
            .enter()
            .append("option")
            .attr("id", d => d.value.toLowerCase())
            .attr("value", d => d.value.toLowerCase())
            .attr("selected", d => {
                return d.name === "Overlap-50" ? "selected" : null;
            })
            .html(d => d.name);

        dropdown.on("change", datasetChanged);
    } catch (e) {
        console.log(e);
    }
}

function buildTooltipTable(data, data_path, dataset, layer_name) {
    try {
        let top_classes = data["top_classes"];
        let percents = data["top_class_percents"];
        let num_rows = data["top_classes"].length;
        let table = "<table class='fixed'>";
        // table += "<thead><th>Class</th><th>Percent</th><th>Ratio</th></thead>";
        for (let i = 0; i < num_rows; i++) {
            table += "<tr>";
            let tc = top_classes[i].split(",")[0].trim();
            let tc_clipped = tc.substr(0, 30) + (tc.length > 30 ? "..." : '');
            table += `<td>${tc_clipped}</td>`;
            table += `<td align="center">${(percents[i] * 100).toFixed(2)}%</td>`;
            table += `<td align="center">${Math.round(percents[i] * data["membership"].length)}/${data["membership"].length}</td>`;
            if (i === 0) {
                table += `<td align="center" rowspan='3'><img src='${data_path}/${dataset}/${layer_name}/${data.id}/opt/avg.jpg'></img></td>`;
            }
            table += "</tr>";
        }
        table += "</table>";
        return table;
    } catch (e) {
        console.log(e);
    }
}

function resetSelection() {
    // Set node and link opacities
    d3.selectAll("#node-group-prev>g").attr("opacity", 1);
    d3.selectAll('#link-group-prev').attr("opacity", 1);
    d3.selectAll("#node-group-curr>g").attr("opacity", 1);
    d3.selectAll('#link-group-curr').attr("opacity", 1);
    d3.selectAll("#node-group-next>g").attr("opacity", 1);
    d3.selectAll('#link-group-next').attr("opacity", 1);

    // Remove the summary-box
    d3.selectAll(".legend-group").remove();

    // Clear all the selected modal-label boxes
    d3.selectAll(".modal-label").classed("selected-label", false);

    // Clear the selection from search-box
    let searchbox = d3.select("#searchbox");
    searchbox.node().value = "";
    // searchbox.dispatch("keyup");
}

async function draw_mapper(layer_name, dataset, svg_container, awesomeplete_instance, pos) {
    const data_path = "./data";

    function handleMouseClick(data) {
        handleMouseOut(data);

        // In HTML event handlers, this refers to the HTML element that received the event
        d3.select(this).select("circle").attr("stroke-width", "3px").classed("focus-node", true);

        // Clear the selection from search-box
        let searchbox = d3.select("#searchbox");
        searchbox.node().value = "";
        searchbox.dispatch("keyup");

        let legend_text_data = data["top_classes"].map(d => {
            return {"label": d.split(",")[0], "len": d.split(",")[0].length}
        });

        let legend_group = d3.select("g#legend-" + pos + "-" + data.id).append("g")
            .attr("class", "legend-group");

        let html_table = legend_group.append("foreignObject")
            .attr("x", 0)
            .attr("y", -40)
            .attr("width", "400px")
            .attr("height", "130px");

        let table_div = html_table.append("xhtml:div")
            .style("padding-top", "10px")
            .style("padding-left", "5px")
            .style("padding-bottom", "10px")
            .style("padding-right", "10px")
            .html(buildTooltipTable(data, data_path, dataset, layer_name));
    }

    function handleMouseOut(data) {
        if (data !== '') {
            d3.selectAll('#node-group-' + pos).attr("opacity", 1);
            d3.selectAll('#link-group-' + pos).attr("opacity", 1);
        }

        d3.selectAll("circle").attr("stroke-width", "1px")
            .classed("focus-node", false);
        d3.selectAll(".legend-group-" + pos).remove();
    }

    function jaccard(link_data) {
        let node_ids = nodes.map(d => d.id);
        let source_size = nodes[node_ids.indexOf(link_data.source)]["membership"].length;
        let target_size = nodes[node_ids.indexOf(link_data.target)]["membership"].length;
        return link_data["intersection"] / (source_size + target_size - link_data["intersection"]);
    }

    function checkStrInArr(strArray, searchTerm) {
        return strArray["top_classes"].flat().join(", ").split(",").map(d => d.trim()).includes(searchTerm.trim());
    }

    // -------------- Cleanup -------------------
    // Remove the previous force-directed graph
    d3.select(svg_container).selectAll("g").remove();
    // Clear selection-details
    handleMouseOut("");
    // Clear searchbox
    d3.select("#searchbox").node().value = "";
    // Remove disable-styles from modal-labels
    d3.selectAll(".modal-label").classed("modal-label-disabled", false);
    // ------------ End Cleanup -----------------

    // Read the mapper results stored in JSON file
    let graph_data = await d3.json(`${data_path}/${dataset}/${layer_name}/output.json`);
    const mapper_svg = d3.select(svg_container).attr("width", "100%").attr("height", "95%");

    // Click anywhere outside the graph to dismiss the summary box
    mapper_svg.on('click', function () {
        if (d3.event.target.id === svg_container.replace("#", "")) {
            d3.selectAll(".legend-group").remove();
        }
    });

    // Force directed graph
    const links = graph_data.links.map(d => Object.create(d));
    const nodes = graph_data.nodes.map(d => Object.create(d));

    // Compute arrays of important properties
    let l2normvals = graph_data.nodes.map(d => parseFloat(d["l2NormAvg"]));
    let membership_length = graph_data.nodes.map(d => d["membership"].length);
    let class_names = graph_data.nodes.map(d => d["top_classes"]);
    // Dedupe and flatten class name
    // class_names = [...new Set(class_names.map(d => d.map(x => x.split(","))).flat(2).map(y => y.trim()))];
    let overlaps = graph_data.links.map(jaccard);

    // Populate autocomplete text-box with new class names from the current layer
    // awesomeplete_instance.list = class_names;

    // Disable all classes not present in current graph
    // Or remove them all together
    // let modal_labels = d3.selectAll(".modal-label");
    // modal_labels.filter(d => d[1].some(x => class_names.indexOf(x) <= 0)).classed("modal-label-disabled", true);
    // modal_labels.filter(d => d[1].some(x => class_names.indexOf(x) <= 0)).remove();

    // ------------------ Scales -------------------
    let color_scale = d3.scaleSequential(d3.interpolateTurbo).domain(d3.extent(l2normvals));
    color_scale.nice();

    let radius_scale = d3.scaleLog()
        .domain(d3.extent(membership_length))
        .range([3, 8]);

    let link_strength_scale = d3.scaleLinear()
        .domain(d3.extent(overlaps))
        .range([1, 10]);

    let links_color_scale = d3.scaleSequential(d3.interpolatePlasma).domain(d3.extent(overlaps));
    links_color_scale.nice();
    // ------------------ End-Scales -------------------


    const mapper_svg_g = mapper_svg.append("g").attr("id", svg_container + "-g");

    let width = Math.max(500, +mapper_svg.style("width").replace("px", ""));
    let height = Math.max(400, +mapper_svg.style("height").replace("px", ""));
    let node_radius = 6;

    // noinspection JSUnresolvedVariable

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody().strength(-5))
        // .force("collision", d3.forceCollide().radius(10))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const link = mapper_svg_g.append("g")
        .attr('id', 'link-group-' + pos)
        .attr("stroke", getColor("--link-stroke-color"))
        .attr("stroke-opacity", 1)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", (d, i) => link_strength_scale(overlaps[i]))
        .attr("stroke", (d, i) => links_color_scale(overlaps[i]));

    link.append("title")
        .text((d, i) => 'Weight = ' + overlaps[i].toFixed(3));

    const node = mapper_svg_g.append("g")
        .attr("id", "node-group-" + pos)
        .attr("stroke", getColor("--node-stroke-color"))
        .attr("stroke-width", 1)
        .attr("stroke-opactiy", 0.6)
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("g");

    node.append("circle")
        .attr("r", d => radius_scale(d["membership"].length))
        .attr("fill", d => color_scale(d["l2NormAvg"]))
        .attr("stroke-width", "1px")
        .attr("id", d => d.id + pos)
        .attr("class", "clickable");

    let img_size = 20;
    node.append("image")
        .attr("xlink:href", d => `${data_path}/${dataset}/${layer_name}/${d.id}/opt/avg.jpg`)
        .attr("x", -img_size / 2)
        .attr("y", -img_size / 2)
        .attr("width", img_size)
        .attr("height", img_size)
        .attr("visibility", d3.select("#node-glyph-checkbox").property("checked") ? "visibile" : "hidden")
        .attr("class", "node-glyph")
        .classed("clickable", true);


    node.append("title")
        .attr("dx", 12)
        .attr("dy", "0.35em")
        .attr("class", "node-label")
        .text(d => "Info:\nID = " + d.id + '\nNode Size = ' + d["membership"].length + "\n" + "Value = " + d['l2NormAvg'].toFixed(4) + '\n\nTop Classes:\n' +
            d["top_classes"].map(x => x.split(",")[0]).join('\t\n'));

    node.on("click", handleMouseClick);

    let legend = mapper_svg_g.append("g")
        .attr("id", "legend-" + pos)
        .selectAll("g")
        .data(nodes)
        .enter()
        .append("g")
        .attr("id", d => "legend-" + pos + "-" + d.id);

    // add drag capabilities
    const drag_handler = d3.drag()
        .on("start", drag_start)
        .on("drag", drag_drag)
        .on("end", drag_end);

    //add zoom capabilities
    const zoom_handler = d3.zoom()
        .on("zoom", zoom_actions);

    drag_handler(node);
    mapper_svg.call(zoom_handler);

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

        legend
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
    });

    // Drag functions
    function drag_start(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    //make sure you can"t drag the circle outside the box
    function drag_drag(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function drag_end(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        // d.fx = null;
        // d.fy = null;
    }

    //Zoom functions
    function zoom_actions() {
        mapper_svg_g.attr("transform", d3.event.transform);
    }

    d3.select("#zoom-in-" + pos).on("click", function () {
        zoom_handler.scaleBy(mapper_svg, 1.2);
    });

    d3.select("#zoom-out-" + pos).on("click", function () {
        zoom_handler.scaleBy(mapper_svg, 0.8);
    });

    return;
}

function getCurrentParams() {
    //  Get the current params - selected layers and dataset
    let selected_layers = d3.selectAll(".selected").data().map(d => "mixed" + d);
    let selected_dataset = d3.select("#dataset-selector");
    return {layers: selected_layers, dataset: selected_dataset.node().value};
}

function populateModal() {
    function modalLabelClicked() {
        d3.select(this).classed("selected-label", !d3.select(this).classed("selected-label"));
    }

    // First clear everthing
    d3.select("#modal-label-holder").remove();

    // Modal window
    const modal = d3.select(".modal-body").append("div").attr("id", "modal-label-holder");

    // Get classes from nodes
    let classes_prev = d3.selectAll("#node-group-prev>g").data().map(x => x["top_classes"][0].split(",").map(y => y.trim())).flat();
    let classes_curr = d3.selectAll("#node-group-curr>g").data().map(x => x["top_classes"][0].split(",").map(y => y.trim())).flat();
    let classes_next = d3.selectAll("#node-group-next>g").data().map(x => x["top_classes"][0].split(",").map(y => y.trim())).flat();
    let classes_all = [...new Set(classes_prev.concat(classes_curr, classes_next))];

    let sorted_labels = classes_all.map(x => [x.charAt(0).toUpperCase(), x]).sort(function (a, b) {
        return a[0] > b[0] ? 1 : -1;
    }).map(x => x[1]);

    awesomplete_inst.list = sorted_labels;

    // Enable searchbox functionality
    // On selection from the auto-complete list, trigger cleanup of side-panel
    // If the searchbox is cleared, restore node and link opacities
    let search_term = d3.select("#searchbox");
    search_term.on("awesomplete-selectcomplete", function () {
        let selected_labels = [search_term.node().value];
        let nodes_prev = d3.selectAll("#node-group-prev>g");
        let links_prev = d3.selectAll("#link-group-prev");
        nodes_prev.attr("opacity", 1);
        nodes_prev.filter(d => array_intersect(d["top_classes"].join(", ").split(",").map(x => x.trim().toLowerCase()), selected_labels.map(x => x.toLowerCase())).length === 0).attr("opacity", 0.1);
        links_prev.attr("opacity", 0.1);

        let nodes_curr = d3.selectAll("#node-group-curr>g");
        let links_curr = d3.selectAll("#link-group-curr");
        nodes_curr.attr("opacity", 1);
        nodes_curr.filter(d => array_intersect(d["top_classes"].join(", ").split(",").map(x => x.trim().toLowerCase()), selected_labels.map(x => x.toLowerCase())).length === 0).attr("opacity", 0.1);
        links_curr.attr("opacity", 0.1);

        let nodes_next = d3.selectAll("#node-group-next>g");
        let links_next = d3.selectAll("#link-group-next");
        nodes_next.attr("opacity", 1);
        nodes_next.filter(d => array_intersect(d["top_classes"].join(", ").split(",").map(x => x.trim().toLowerCase()), selected_labels.map(x => x.toLowerCase())).length === 0).attr("opacity", 0.1);
        links_next.attr("opacity", 0.1);
    });

    search_term.on("keyup", function () {
        let search_term_val = search_term.node().value;
        if (search_term_val === "") {
            resetSelection();
        }
    });

    let groupBy = function (xs, key) {
        return xs.reduce(function (rv, x) {
            (rv[key(x)] = rv[key(x)] || []).push(x);
            return rv;
        }, {});
    };

    let grouped_labels = groupBy(sorted_labels.map(x => x.toLowerCase()), x => x.charAt(0).toLowerCase());

    console.log('grouped', grouped_labels);

    let modal_directory_divs = modal.selectAll("div")
        .data(Object.entries(grouped_labels))
        .enter()
        .append("div")
        .attr("id", d => "modal-directory-" + d[0])
        .style("padding-top", "10px")
        .style("padding-bottom", "10px");

    let modal_class_sections = modal_directory_divs.append("div")
        .classed("modal-directory-listing", true)
        .html(d => d[0].toUpperCase());

    let modal_class_labels = modal_directory_divs.append("div")
        .style("padding-left", "2em")
        .selectAll("span")
        .data(d => d[1].sort())
        .enter()
        .append("span")
        .classed("modal-label", true)
        .classed("clickable", true)
        .html(x => x)
        .on("click", modalLabelClicked);
}

function make_modal_window() {
    // Get the modal
    const modal = document.getElementById("classes-modal");

    // Get the button that opens the modal
    const btn = document.getElementById("myBtn");

    // Get the <span> element that closes the modal
    const span = document.getElementsByClassName("close")[0];

    // When the user clicks the button, open the modal
    btn.onclick = function () {
        modal.style.display = "block";
    };

    function isIntersectionEmpty(arr1, arr2) {

    }

    // When the user clicks on <span> (x), close the modal
    span.onclick = function () {
        modal.style.display = "none";
        let selected_labels = d3.selectAll(".selected-label").data().flat();

        // set searchbox to selected-labels value
        d3.select("#searchbox").node().value = selected_labels.join(", ");

        if (selected_labels.length !== 0) {
            d3.selectAll(".legend-group").remove();

            let nodes_prev = d3.selectAll("#node-group-prev>g");
            let links_prev = d3.selectAll("#link-group-prev");
            nodes_prev.attr("opacity", 1);
            nodes_prev.filter(d => array_intersect(d["top_classes"].join(", ").split(",").map(x => x.trim().toLowerCase()), selected_labels.map(x => x.toLowerCase())).length === 0).attr("opacity", 0.1);
            links_prev.attr("opacity", 0.1);

            let nodes_curr = d3.selectAll("#node-group-curr>g");
            let links_curr = d3.selectAll("#link-group-curr");
            nodes_curr.attr("opacity", 1);
            nodes_curr.filter(d => array_intersect(d["top_classes"].join(", ").split(",").map(x => x.trim().toLowerCase()), selected_labels.map(x => x.toLowerCase())).length === 0).attr("opacity", 0.1);
            links_curr.attr("opacity", 0.1);

            let nodes_next = d3.selectAll("#node-group-next>g");
            let links_next = d3.selectAll("#link-group-next");
            nodes_next.attr("opacity", 1);
            nodes_next.filter(d => array_intersect(d["top_classes"].join(", ").split(",").map(x => x.trim().toLowerCase()), selected_labels.map(x => x.toLowerCase())).length === 0).attr("opacity", 0.1);
            links_next.attr("opacity", 0.1);
        } else {
            resetSelection();
        }
    };

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
            let selected_labels = d3.selectAll(".selected-label").data().flat();

            // set searchbox to selected-labels value
            d3.select("#searchbox").node().value = selected_labels.join(", ");

            if (selected_labels.length !== 0) {
                d3.selectAll(".legend-group").remove();

                let nodes_prev = d3.selectAll("#node-group-prev>g");
                let links_prev = d3.selectAll("#link-group-prev");
                nodes_prev.attr("opacity", 1);
                nodes_prev.filter(d => array_intersect(d["top_classes"].join(", ").split(",").map(x => x.trim().toLowerCase()), selected_labels.map(x => x.toLowerCase())).length === 0).attr("opacity", 0.1);
                links_prev.attr("opacity", 0.1);

                let nodes_curr = d3.selectAll("#node-group-curr>g");
                let links_curr = d3.selectAll("#link-group-curr");
                nodes_curr.attr("opacity", 1);
                nodes_curr.filter(d => array_intersect(d["top_classes"].join(", ").split(",").map(x => x.trim().toLowerCase()), selected_labels.map(x => x.toLowerCase())).length === 0).attr("opacity", 0.1);
                links_curr.attr("opacity", 0.1);

                let nodes_next = d3.selectAll("#node-group-next>g");
                let links_next = d3.selectAll("#link-group-next");
                nodes_next.attr("opacity", 1);
                nodes_next.filter(d => array_intersect(d["top_classes"].join(", ").split(",").map(x => x.trim().toLowerCase()), selected_labels.map(x => x.toLowerCase())).length === 0).attr("opacity", 0.1);
                links_next.attr("opacity", 0.1);
            } else {
                resetSelection();
            }
        }
    }
}

async function draw_helper() {
    let {dataset, layers} = getCurrentParams();
    await draw_mapper(layers[0], dataset, '#mapper-svg-prev', awesomplete_inst, "prev");
    await draw_mapper(layers[1], dataset, '#mapper-svg-curr', awesomplete_inst, "curr");
    await draw_mapper(layers[2], dataset, '#mapper-svg-next', awesomplete_inst, "next");
    populateModal();
}

// Wrapper to call all functions
async function wrapper() {
    try {
        // Read the label file
        labels = Object.values(await d3.json("data/labels.json"));
        labels = labels.map(x => x.split(",").map(y => y.trim()));
        buildLayers();
        buildDatasetDropdown();
        make_modal_window();
        await draw_helper();

    } catch (e) {
        console.log(e)
    }
}

wrapper();