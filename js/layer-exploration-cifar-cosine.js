var labels, simulation, projection_chart,
    awesomplete_inst = new Awesomplete(document.getElementById("searchbox"), {minChars: 1, maxItems: 20,});

function getSimulation() {
    return simulation;
}

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

function responsivefy(svg) {
    // get container + svg aspect ratio
    let container = d3.select(svg.node().parentNode),
        width = parseInt(svg.style("width")),
        height = parseInt(svg.style("height")),
        aspect = width / height;

    // add viewBox and preserveAspectRatio properties,
    // and call resize so that svg resizes on inital page load
    svg.attr("viewBox", "0 0 " + width + " " + height)
        .attr("perserveAspectRatio", "xMinYMid")
        .call(resize);

    // to register multiple listeners for same event type,
    // you need to add namespace, i.e., 'click.foo'
    // necessary if you call invoke this function for multiple svgs
    // api docs: https://github.com/mbostock/d3/wiki/Selections#on
    d3.select(window).on("resize." + container.attr("id"), resize);

    // get width of container and resize svg to fit it
    function resize() {
        let targetWidth = parseInt(container.style("width"));
        svg.attr("width", targetWidth);
        svg.attr("height", Math.round(targetWidth / aspect));
    }
}

function getColor(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name);
}

function jaccard_filtering(event) {
    d3.select('#jaccard-value').html(this.value);
    let graph_links = d3.selectAll('.graph-links');
    graph_links.attr('visibility', 'visible');
    graph_links.filter(l => l.jaccard <= this.value).attr('visibility', 'hidden');
    graph_links.filter(l => l.jaccard > this.value).attr('visibility', 'visible');
}

function buildLayers() {
    function layerBtnClicked(data) {
        // First set all layer-buttons to unselected
        d3.selectAll("div.layer-button").classed("selected", false);

        // Then set clicked div to selected
        let layerDiv = d3.select(d3.event.target);
        layerDiv.classed("selected", true);

        let {dataset, layer} = getCurrentParams();
        populateModal();
        draw_mapper(layer, dataset, "mapper-svg", awesomplete_inst);
    }

    try {
        let layers = ["layer0.1.bn1", "layer1.1.bn2", "layer2.1.bn2", "layer3.1.bn2", "layer4.1.bn2"];

        let layer_div = d3.select("div#toolbar-layer-list");
        layer_div.selectAll("div.layer-button")
            .data(layers)
            .enter()
            .append("div")
            .attr("id", d => d)
            .attr("class", "layer-button")
            .classed("selected", d => d === "layer0.1.bn1")
            .html(d => d)
            .attr("title", d => d)
            .on('click', layerBtnClicked);

        // let glyph_div = layer_div.append("div")
        //     .attr('id', 'glyph_div')
        //     .style("visibility", "hidden")
        //     .style("margin", "30px");
        //
        // glyph_div.append("input")
        //     .attr("type", "checkbox")
        //     .style("display", "inline-block")
        //     .attr("title", "Overlay average activation image for each node on the graph")
        //     .attr("id", "node-glyph-checkbox");
        //
        // glyph_div.append("label")
        //     .attr("for", "node-glyph-checkbox")
        //     .attr("title", "Overlay average activation image for each node on the graph")
        //     .html("Show activation images");
        //
        // d3.select("#node-glyph-checkbox").on("change", function () {
        //     let glyph_checkbox = d3.select("#node-glyph-checkbox");
        //     if (glyph_checkbox.property("checked")) {
        //         d3.selectAll(".node-glyph").attr("visibility", "visible");
        //     } else {
        //         d3.selectAll(".node-glyph").attr("visibility", "hidden");
        //     }
        // });
        // Set 3a as default selected layer

        let jaccard_slider = layer_div.append('div')
            .style('margin-left', '30px')
            .attr('id', 'jaccard-slider')
            .html('Jaccard Threshold: <span id="jaccard-value">0</span>')
        
        jaccard_slider.append('input')
            .attr('type', 'range')
            .attr('min', 0)
            .attr('max', 1)
            .attr('step', 0.01)
            .attr('value', 0)
            .on('input', jaccard_filtering);

        } catch (e) {
        console.log(e)
    }
}

function buildProjections() {
    let layer_div = d3.select("div#toolbar-layer-list");
    let projection_div = layer_div.append("div")
        .attr("id", "projection_div");

    let projection_selector = projection_div.append("select")
        .attr("id", "projection-selector");

    projection_selector.append("option").attr("value", "None").attr("selected", 'None').html("Select projection");
    projection_selector.append("option").attr("value", "TSNE-5000").html("t-SNE");
    projection_selector.append("option").attr("value", "UMAP-5000").html("UMAP");

    projection_selector.on("change", function () {
        let selected_value = projection_selector.property("value");
        let num_points = selected_value.split('-')[1];
        let mapper_svg = d3.select("#mapper-svg");
        let {dataset, layer} = getCurrentParams();
        let projection = d3.select("#projection-selector").property("value").split('-')[0];

        if (selected_value.startsWith("TSNE")) {
            if (!d3.select("#projection-svg").empty()) {
                d3.select("#projection-svg").remove();
            }
            mapper_svg.transition().attr("width", "48%").on("end", function () {
                getSimulation().force("center", d3.forceCenter(parseInt(mapper_svg.style("width")) / 2, parseInt(mapper_svg.style("height")) / 2));
                getSimulation().nodes().forEach(d => {
                    d.fx = null;
                    d.fy = null
                });
                getSimulation().alpha(0.5).restart();
            });

            // Create a new svg in the parent container
            let container = d3.select("#mapper");

            let projection_svg = container.insert("div", ":first-child")
                .attr("id", "projection-svg")
                .style("background-color", getColor("--toolbar-bg-color"))
                .style("display", "inline-block")
                .style("width", "49%")
                .style("border-right", "1px solid var(--separator-color)");

            let projection_canvas = projection_svg.append("canvas")
                .attr("id", "projection-canvas")
                .attr("width", container.node().getBoundingClientRect().width / 2)
                .attr("height", container.node().getBoundingClientRect().height / 1.5);

            draw_scatter_canvas(layer, projection, num_points, projection_canvas);
        } else if (selected_value.startsWith("UMAP")) {
            if (!d3.select("#projection-svg").empty()) {
                d3.select("#projection-svg").remove();
            }
            mapper_svg.transition().attr("width", "48%").on("end", function () {
                getSimulation().force("center", d3.forceCenter(parseInt(mapper_svg.style("width")) / 2, parseInt(mapper_svg.style("height")) / 2));
                getSimulation().nodes().forEach(d => {
                    d.fx = null;
                    d.fy = null
                });
                getSimulation().alpha(0.5).restart();
            });

            // Create a new svg in the parent container
            let container = d3.select("#mapper");

            let projection_svg = container.insert("div", ":first-child")
                .attr("id", "projection-svg")
                .style("background-color", getColor("--toolbar-bg-color"))
                .style("display", "inline-block")
                .style("width", "48%");

            let projection_canvas = projection_svg.append("canvas")
                .attr("id", "projection-canvas")
                .attr("width", container.node().getBoundingClientRect().width / 2 - 10)
                .attr("height", container.node().getBoundingClientRect().height / 1.5);

            draw_scatter_canvas(layer, projection, num_points, projection_canvas);
        } else if (selected_value === "None") {
            let projection_svg = d3.select("#projection-svg");
            projection_svg.remove();
            mapper_svg.transition().attr("width", "100%").on("end", function () {
                getSimulation().force("center", d3.forceCenter(parseInt(mapper_svg.style("width")) / 2, parseInt(mapper_svg.style("height")) / 2));
                getSimulation().nodes().forEach(d => {
                    d.fx = null;
                    d.fy = null
                });
                getSimulation().alpha(0.5).restart();
            });
        }
    });

    async function draw_scatter(layer, method, svg_element) {
        let data_path = './data/2d-activations-cifar';
        let plot_data = await d3.csv(`${data_path}/cifar_${layer}_${method}_euclidean.csv`);
        for (let i = 0; i < plot_data.length; i++) {
            plot_data[i].x = parseFloat(plot_data[i].x);
            plot_data[i].y = parseFloat(plot_data[i].y);
            plot_data[i].label = parseInt(plot_data[i].label);
        }
        let scalex = d3.scaleLinear().domain(d3.extent(plot_data.map(d => d.x))).range([5, 95]);
        let scaley = d3.scaleLinear().domain(d3.extent(plot_data.map(d => d.y))).range([5, 95]);

        let projection_points = svg_element.selectAll("circle")
            .data(plot_data)
            .enter()
            .append("circle")
            .attr("cx", d => scalex(d.x))
            .attr("cy", d => scaley(d.y))
            .attr("stroke", "none")
            .attr("stroke-width", 0.1)
            .attr("fill", "#1f77b4")
            .attr("fill-opacity", 0.4)
            .attr("data", d => labels[d.label])
            .attr('class', 'projection-point')
            .attr("r", 1);

        projection_points.append("title")
            .text(d => labels[d.label]);
    }

    async function draw_scatter_canvas(layer, method, num_points, canvas_elem) {
        try {
            if (layer === 'layer0.1.bn1') {
                layer = 'bn1';
            }

            let data_path = './data/2d-activations-cifar';
            file_path = `${data_path}/cifar_${layer}_${method.toLowerCase()}_cosine.csv?dummy=123451`
            console.log(file_path);
            d3.csv(file_path).then(function (plot_data) {
                    let data = [];
                    for (let i = 0; i < plot_data.length; i++) {
                        data.push({
                            x: parseFloat(plot_data[i].x),
                            y: parseFloat(plot_data[i].y),
                            label: parseInt(plot_data[i].label)
                        });
                    }
                    let chartColors = {
                        red: 'rgb(255, 99, 132)',
                        orange: 'rgb(255, 159, 64)',
                        yellow: 'rgb(255, 205, 86)',
                        green: 'rgb(75, 192, 192)',
                        blue: 'rgb(54, 162, 235)',
                        purple: 'rgb(153, 102, 255)',
                        grey: 'rgb(201, 203, 207)'
                    };

                    Chart.defaults.global.legend.display = false;
                    let scatterChartData = {
                        datasets: [
                            {
                                borderColor: chartColors.blue,
                                backgroundColor: Chart.helpers.color('#36A2EB').alpha(0.1).rgbString(),
                                pointBorderWidth: 0.0001,
                                data: data
                            },
                        ]
                    };
                    console.log(data.length);

                    projection_chart = new Chart(canvas_elem.node().getContext('2d'), {
                        type: 'scatter',
                        data: scatterChartData,
                        options: {
                            responsive: false,
                            title: {
                                display: true,
                                // text: 'Chart.js Scatter Chart'
                            },
                            scales: {
                                xAxes: [{
                                    gridLines: {
                                        drawBorder: false,
                                        display: false,
                                    },
                                    ticks: {
                                        display: false,
                                    }
                                }],
                                yAxes: [{
                                    gridLines: {
                                        drawBorder: false,
                                        display: false
                                    },
                                    ticks: {
                                        display: false
                                    }
                                }]
                            },
                            animation: {duration: 0},
                            tooltips: {enabled: false},
                            hover: {animationDuration: 0},
                        }
                    });
                }
            );
        } catch
            (e) {
            console.log(e);
        }
    }
}

async function buildDatasetDropdown() {
    async function datasetChanged() {
        let {dataset, layer} = getCurrentParams();

        if (dataset.startsWith('cifar10')) {
            labels = Object.values(await d3.json("data-cifar/labels-cifar10.json"));
        } else {
            labels = Object.values(await d3.json("data-cifar/labels-cifar100.json"));
        }
        populateModal();
        draw_mapper(layer, dataset, "mapper-svg", awesomplete_inst);
    }

    try {
        let cubes = [40, 80];
        let overlaps = [2, 4];
        let datasets = [];

        let cifar_datasets = [
            {name: "CIFAR10-Intervals=40,Overlap=20", value: "cifar10_40_2"},
            {name: "CIFAR10-Intervals=40,Overlap=40", value: "cifar10_40_2"},
            {name: "CIFAR10-Intervals=100,Overlap=20", value: "cifar10_100_2"},
            {name: "CIFAR10-Intervals=100,Overlap=40", value: "cifar10_100_4"}];
        cifar_datasets.forEach(d => datasets.push(d));

        let cube_overlap = cubes.forEach(x => overlaps.forEach(y => datasets.push({
            name: "CIFAR100-Intervals=" + x + ",Overlap=" + y,
            value: "cifar_" + x + "_" + y
        })));

        // let datasets = [
        //     {name: "Overlap-20-Epsilon-Fixed", value: "overlap-20"},
        //     {name: "Overlap-30-Epsilon-Fixed", value: "overlap-30"},
        //     {name: "Overlap-50-Epsilon-Fixed", value: "overlap-50"},
        //     {name: "Overlap-20-Epsilon-Adaptive", value: "overlap-20-eps"},
        //     {name: "Overlap-30-Epsilon-Adaptive", value: "overlap-30-eps"},
        //     {name: "Overlap-50-Epsilon-Adaptive", value: "overlap-50-eps"},
        // ];

        let dropdown = d3.select("#dataset-selector");
        dropdown.selectAll("option")
            .data(datasets)
            .enter()
            .append("option")
            .attr("id", d => d.value.toLowerCase())
            .attr("value", d => d.value.toLowerCase())
            .attr("selected", d => {
                return d.name === "cifar_40_2" ? "selected" : null;
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
            let tc = labels[parseInt(top_classes[i].replace("label", ""))];
            table += `<td>${tc}</td>`;
            table += `<td align="center">${(percents[i] * 100).toFixed(2)}%</td>`;
            table += `<td align="center">${Math.round(percents[i] * data["membership"].length)}/${data["membership"].length}</td>`;
            // if (i === 0) {
            //     table += `<td align="center" rowspan='3'><img src='${data_path}/${dataset}/${layer_name}/${data.id}/opt/avg.jpg'></img></td>`;
            // }
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
    d3.selectAll("#node-group>g").attr("opacity", 1);
    d3.selectAll('#link-group').attr("opacity", 1);

    // Remove the summary-box
    d3.selectAll(".legend-group").remove();

    // Clear all the selected modal-label boxes
    d3.selectAll(".modal-label").classed("selected-label", false);

    // Clear the selection from search-box
    let searchbox = d3.select("#searchbox");
    searchbox.node().value = "";
    // searchbox.dispatch("keyup");

    // Remove highlighted points from the projection view
    if (d3.select("#projection-selector").property("value") !== "None") {
        for (let i = 1; i < projection_chart.data.datasets.length; i++) {
            projection_chart.data.datasets[i].data = [];
        }
        projection_chart.update();
    }
}

async function draw_mapper(layer_name, dataset, svg_container, awesomeplete_instance) {

    const data_path = "./data-cifar-cosine";

    function handleMouseClick(data) {
        handleMouseOut(data, false);

        // In HTML event handlers, this refers to the HTML element that received the event
        d3.select(this).select("circle").attr("stroke-width", "3px").classed("focus-node", true);

        // Clear the selection from search-box
        let searchbox = d3.select("#searchbox");
        searchbox.node().value = "";
        searchbox.dispatch("keyup");

        let legend_text_data = data["top_classes"].map(d => {
            return {"label": d.split(",")[0], "len": d.split(",")[0].length}
        });
        console.log(legend_text_data);
        let legend_group = d3.select("g#legend-" + data.id).append("g")
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

        let close_button = table_div.append("span")
            .attr("id", "close")
            .classed("fas fa-window-close", true)
            .classed("legend-close", true)
            .classed("clickable", true)
            .on("click", function () {
                d3.selectAll(".legend-group").remove();
            });
        // .html("x");

        let orig_imgdiv = d3.select("#original-images-grid");
        let orig_image_list = [];

        for (let i = 0; i < data["top_classes"].length; i++) {
            for (let j = 0; j < 5; j++) {
                let img_src = `${data_path}/${dataset}/${layer_name}/${data.id}/icons/${data["top_classes"][i]}_${j}.jpg`;
                orig_image_list.push(img_src);
            }
        }

        orig_imgdiv.selectAll("img")
            .data(orig_image_list)
            .enter()
            .append("img")
            .attr("src", d => d)
            .attr("onError", "this.onerror=null;this.src='data/onerror.png'")
            .attr("style", "margin: 1px; width:100%");

        let act_imgdiv = d3.select("#activation-images-grid");
        let act_image_list = [];

        for (let i = 0; i < data["top_classes"].length; i++) {
            for (let j = 0; j < 5; j++) {
                let img_src = `${data_path}/${dataset}/${layer_name}/${data.id}/opt/${data["top_classes"][i]}${j}.jpg`;
                act_image_list.push(img_src);
            }
        }

        act_imgdiv.selectAll("img")
            .data(act_image_list)
            .enter()
            .append("img")
            .attr("onError", "this.onerror=null;this.src='data/onerror.png'")
            .attr("src", d => d)
            .attr("style", "margin: 1px; width:100%");

        // Add average activation image
        let avg_image_path = `${data_path}/${dataset}/${layer_name}/${data.id}/opt/avg.jpg`;
        d3.select("#average-activation")
            // .attr("id", "averaged-image")
            // .html("Averaged activation image <hr style='width: 100%'>")
            .append("img")
            .attr("onError", "this.onerror=null;this.src='data/onerror.png'")
            .attr("src", avg_image_path)
            .attr("style", "margin: 1px; width:30%; display: block; margin: auto; image-rendering: pixelated;");

        function create_image_list(layer_name, cluster_id) {
            let image_list = [];
            for (let i = 0; i < 15; i++) {
                let img_src = `${data_path}/${dataset}/${layer_name}/${cluster_id}/opt/optimized_image_${i}.jpg`;
                image_list.push(img_src);
            }
            return image_list;
        }

        act_imgdiv.exit().remove();

        let top_classes_div = d3.select("#top-classes");
        top_classes_div.append("ul")
            .attr("id", "top-classes-list")
            .attr("style", "padding-left: 0")
            .selectAll("li")
            .data(data["top_classes"])
            .enter()
            .append("li")
            .html(d => labels[parseInt(d.replace("label", ""))]);

        // Highlight nodes in projection view
        if (getCurrentParams().projection !== "None") {
            function addData(chart, label, color, data) {
                projection_chart.chart.data.datasets.push({
                    label: label,
                    backgroundColor: color,
                    data: data,
                    order: -1,
                    pointRadius: 3
                });
                chart.update();
            }
        
            // Create two datasets - highlighted points and non-highlighted points
            let projection_points = projection_chart.data.datasets[0].data;
            console.log(projection_points, data['top_classes']);
            let update_data = projection_points.filter(d => checkStrInArr(data, 'label' + d.label));
            addData(projection_chart, 'selected', '#ff9511', update_data);
        }
    }

    function handleMouseOut(data, clear_prev_selection) {
        if (data !== '') {
            node.attr("opacity", 1);
            d3.selectAll('#link-group').attr("opacity", 1);
        }

        if (clear_prev_selection) {
            d3.selectAll("circle.graph-vertex").attr("stroke-width", "1px")
                .classed("focus-node", false);
        }

        d3.selectAll(".legend-group").remove();

        let orig_imgdiv = d3.select("#original-images");
        orig_imgdiv.selectAll("img").remove();

        let act_imgdiv = d3.select("#activation-images");
        act_imgdiv.selectAll("img").remove();

        d3.select("#average-activation").selectAll("img").remove();

        let top_classes_div = d3.select("#top-classes");
        top_classes_div.html("");
    }

    function jaccard(link_data) {
        // return link_data["intersection"];
        let node_ids = nodes.map(d => d.id);
        let source_size = nodes[node_ids.indexOf(link_data.source)]["membership"].length;
        let target_size = nodes[node_ids.indexOf(link_data.target)]["membership"].length;
        return link_data["intersection"] / (source_size + target_size - link_data["intersection"]);
    }

    function checkStrInArr(strArray, searchTerm) {
        // console.log(strArray['top_classes'], searchTerm);
        return strArray["top_classes"].flat().join(", ").split(",").map(d => d.trim()).includes(searchTerm.trim());
    }

    // -------------- Cleanup -------------------
    // Remove the previous force-directed graph
    d3.select("#mapper-svg").selectAll("g").remove();
    // Clear selection-details
    handleMouseOut("", true);
    // Clear searchbox
    d3.select("#searchbox").node().value = "";
    // Remove disabled-styles from modal-labels
    d3.selectAll(".modal-label").classed("modal-label-disabled", false);
    // Reset the projection panel
    d3.select("#projection-selector").property("value", "None").dispatch("change");
    // ------------ End Cleanup -----------------

    // Read the mapper results stored in JSON file
    let graph_data = await d3.json(`${data_path}/${dataset}/${layer_name}/output.json`);
    const mapper_svg = d3.select("#mapper-svg").attr("width", "100%").attr("height", "100%");
    // mapper_svg.call(responsivefy);

    // Click anywhere outside the graph to dismiss the summary box
    mapper_svg.on('click', function () {
        if (d3.event.target.id === "mapper-svg") {
            // Remove legend
            d3.selectAll(".legend-group").remove();
            // Remove previously highlighted nodes
            d3.selectAll("circle.graph-vertex").attr("stroke-width", "1px")
                .classed("focus-node", false);
            // Remove highlighted points from the projection view
            if (d3.select("#projection-selector").property("value") !== "None") {
                for (let i = 1; i < projection_chart.data.datasets.length; i++) {
                    projection_chart.data.datasets[i].data = [];
                }
                projection_chart.update();
            }
        }
    });

    // Force directed graph
    const links = graph_data.links.map(d => Object.create(d));
    const nodes = graph_data.nodes.map(d => Object.create(d));

    links.forEach((element, index, arr) => {
        links[index].jaccard = jaccard(element);
    })

    // Compute arrays of important properties
    let l2normvals = graph_data.nodes.map(d => parseFloat(d["l2NormAvg"]));
    let membership_length = graph_data.nodes.map(d => d["membership"].length);
    let class_names = graph_data.nodes.map(d => d["top_classes"]);
    // Dedupe and flatten class name
    // class_names = [...new Set(class_names.map(d => d.map(x => x.split(","))).flat(2).map(y => y.trim()))];
    class_names = labels.map(x => x[0]);
    let overlaps = graph_data.links.map(jaccard);

    // Populate autocomplete text-box with new class names from the current layer
    awesomeplete_instance.list = class_names;

    // Disable all classes not present in current graph
    // Or remove them all together
    let modal_labels = d3.selectAll(".modal-label");
    // modal_labels.filter(d => d[1].some(x => class_names.indexOf(x) <= 0)).classed("modal-label-disabled", true);
    // modal_labels.filter(d => d[1].some(x => class_names.indexOf(x) <= 0)).remove();
    // Remove empty directory listings
    // Get empty alphabets
    let empty_alph = d3.selectAll(".modal-directory-top").select(".span-holder").filter(function (x) {
        return this.childNodes.length === 0
    }).data().map(x => x[0]);
    // and remove divs whose ids have the empty alphabets
    empty_alph.map(x => d3.select("#modal-directory-" + x).remove());

    // Enable searchbox functionality
    // On selection from the auto-complete list, trigger cleanup of side-panel
    // If the searchbox is cleared, restore node and link opacities
    let search_term = d3.select("#searchbox");
    search_term.on("awesomplete-selectcomplete", function () {
        handleMouseOut("", true);
        let search_term_val = search_term.node().value;
        // console.log(class_names.indexOf(search_term_val));
        if (search_term_val === "") {
            resetSelection();
        } else {
            search_term_val = 'label' + class_names.indexOf(search_term_val);
            node.filter(d => !checkStrInArr(d, search_term_val)).attr("opacity", 0.1);
            d3.selectAll('#link-group').attr("opacity", 0.1);

            if (getCurrentParams().projection !== "None") {
                function addData(chart, label, color, data) {
                    projection_chart.chart.data.datasets.push({
                        label: label,
                        backgroundColor: color,
                        data: data,
                        order: -1,
                        pointRadius: 3
                    });
                    chart.update();
                }
    
                // Create two datasets - highlighted points and non-highlighted points
                let projection_points = projection_chart.data.datasets[0].data;
                console.log(projection_points, search_term_val);
                let update_data = projection_points.filter(d => d.label == search_term_val.replace('label', ''));
                addData(projection_chart, 'selected', '#ff9511', update_data);
            }
        }
    });
    search_term.on("keyup", function () {
        let search_term_val = search_term.node().value;
        if (search_term_val === "") {
            resetSelection();
        }
    });

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


    const mapper_svg_g = mapper_svg.append("g").attr("id", "mapper-svg-g");

    let width = Math.max(500, +mapper_svg.style("width").replace("px", ""));
    let height = Math.max(400, +mapper_svg.style("height").replace("px", ""));
    let node_radius = 6;

// noinspection JSUnresolvedVariable

    simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody().strength(-5))
        // .force("collision", d3.forceCollide().radius(10))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const link = mapper_svg_g.append("g")
        .attr('id', 'link-group')
        .attr("stroke", getColor("--link-stroke-color"))
        .attr("stroke-opacity", 1)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("class", "graph-links")
        .attr("stroke-width", (d, i) => link_strength_scale(overlaps[i]))
        .attr("stroke", (d, i) => links_color_scale(overlaps[i]));

    link.append("title")
        .text((d, i) => 'Weight = ' + overlaps[i].toFixed(3));

    const node = mapper_svg_g.append("g")
        .attr("stroke", getColor("--node-stroke-color"))
        .attr("stroke-width", 1)
        .attr("stroke-opactiy", 0.6)
        .attr("id", "node-group")
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("g");

    node.append("circle")
        .attr("r", d => radius_scale(d["membership"].length))
        .attr("fill", d => color_scale(d["l2NormAvg"]))
        .attr("stroke-width", "1px")
        .attr("id", d => d.id)
        .attr("class", "clickable graph-vertex");

    let img_size = 20;
    // node.append("image")
    //     .attr("xlink:href", d => `${data_path}/${dataset}/${layer_name}/${d.id}/opt/avg.jpg`)
    //     .attr("x", -img_size / 2)
    //     .attr("y", -img_size / 2)
    //     .attr("width", img_size)
    //     .attr("height", img_size)
    //     .attr("visibility", d3.select("#node-glyph-checkbox").property("checked") ? "visibile" : "hidden")
    //     .attr("class", "node-glyph")
    //     .classed("clickable", true);


    node.append("title")
        .attr("dx", 12)
        .attr("dy", "0.35em")
        .attr("class", "node-label")
        .text(d => "Info:\nID = " + d.id + '\n Node Size = ' + d["membership"].length + "\n" + "Value = " + d['l2NormAvg'].toFixed(4) + '\n\nTop Classes:\n' +
            d["top_classes"].map(x => x.split(",")[0]).join('\t\n'));

    node.on("click", handleMouseClick);

    let legend = mapper_svg_g.append("g")
        .attr("id", "legend")
        .selectAll("g")
        .data(nodes)
        .enter()
        .append("g")
        .attr("id", d => "legend-" + d.id);

// add drag capabilities
    const drag_handler = d3.drag()
        .on("start", drag_start)
        .on("drag", drag_drag)
        .on("end", drag_end);

//add zoom capabilities
    const zoom_handler = d3.zoom()
        .scaleExtent([0.2, 5])
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

    d3.select("#zoom-in").on("click", function () {
        zoom_handler.scaleBy(mapper_svg, 1.2);
    });

    d3.select("#zoom-out").on("click", function () {
        zoom_handler.scaleBy(mapper_svg, 0.8);
    });
}

function getCurrentParams() {
    //  Get the current params - selected layer and dataset
    let selected_layer = d3.select(".selected").node().id;
    let selected_dataset = d3.select("#dataset-selector");
    // let selected_projection = d3.select("#projection-selector").property("value").split('-')[0];
    if (selected_layer.startsWith("layer0")) {
        selected_layer = "bn1";
    }
    return {
        layer: selected_layer,
        dataset: selected_dataset.node().value,
        // projection: selected_projection
    };
}

function populateModal() {
    function smallestString(strArr) {
        return strArr[strArr.indexOf(Math.max(strArr.split(",").map(x => x.length)))];
    }

    function modalLabelClicked() {
        d3.select(this).classed("selected-label", !d3.select(this).classed("selected-label"));
    }

    // Modal window
    const modal = d3.select(".modal-body");
    modal.selectAll("*").remove();
    // let sorted_labels = labels.map(d => d[0]).map(x => x.charAt(0).toUpperCase() + x.slice(1)).sort();
    let sorted_labels = labels.map(x => [x[0].charAt(0).toUpperCase(), x]).sort(function (a, b) {
        return a[0] > b[0] ? 1 : -1;
    });

    let groupBy = function (xs, key) {
        return xs.reduce(function (rv, x) {
            (rv[key(x)] = rv[key(x)] || []).push(x);
            return rv;
        }, {});
    };

    let grouped_labels = groupBy(sorted_labels, function (x) {
        return x[0];
    });

    let modal_directory_divs = modal.selectAll("div")
        .data(Object.entries(grouped_labels).filter(x => x[1].length > 0))
        .enter()
        .append("div")
        .attr("id", d => "modal-directory-" + d[0])
        .attr("class", "modal-directory-top")
        // .style("border-bottom", "1px solid grey")
        .style("padding-top", "10px")
        .style("padding-bottom", "10px");

    let modal_class_sections = modal_directory_divs.append("div")
        .classed("modal-directory-listing", true)
        .html(d => d[0]);

    let modal_class_labels = modal_directory_divs.append("div")
        .style("padding-left", "2em")
        .classed("span-holder", true)
        .selectAll("span")
        .data(d => d[1])
        .enter()
        .append("span")
        .classed("modal-label", true)
        .classed("clickable", true)
        .html(x => x[1][0])
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

    // When the user clicks on <span> (x), close the modal
    span.onclick = function () {
        modal.style.display = "none";
        let selected_labels = d3.selectAll(".selected-label").data().map(x => x[1]).flat();

        // set searchbox to selected-labels value
        d3.select("#searchbox").node().value = selected_labels.join(", ");

        if (selected_labels.length !== 0) {
            let nodes = d3.selectAll("#node-group>g");
            let links = d3.selectAll("#link-group");
            d3.selectAll(".legend-group").remove();
            nodes.attr("opacity", 1);
            nodes.filter(d => array_intersect(d["top_classes"].join(", ").split(",").map(x => x.trim().toLowerCase()), selected_labels.map(x => x.toLowerCase())).length === 0).attr("opacity", 0.1);
            links.attr("opacity", 0.1);
        } else {
            resetSelection();
        }
    };

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
            let selected_labels = d3.selectAll(".selected-label").data().map(x => x[1]).flat();

            // set searchbox to selected-labels value
            d3.select("#searchbox").node().value = d3.selectAll(".selected-label").data().map(x => x[1][0]).join(", ");

            if (selected_labels.length !== 0) {
                let nodes = d3.selectAll("#node-group>g");
                let links = d3.selectAll("#link-group");
                d3.selectAll(".legend-group").remove();
                nodes.attr("opacity", 1);
                nodes.filter(d => array_intersect(d["top_classes"].join(", ").split(",").map(x => x.trim().toLowerCase()), selected_labels.map(x => x.toLowerCase())).length === 0).attr("opacity", 0.1);
                links.attr("opacity", 0.1);
            } else {
                resetSelection();
            }
        }
    }
}

// Wrapper to call all functions
async function wrapper() {
    try {
        // Read the label file
        labels = Object.values(await d3.json("data-cifar/labels-cifar10.json"));
        labels = labels.map(x => x.split(",").map(y => y.trim()));
        buildLayers();
        await buildDatasetDropdown();
        make_modal_window();
        populateModal();
        let {dataset, layer} = getCurrentParams();

        draw_mapper(layer, dataset, '#mapper-svg', awesomplete_inst);
        buildProjections();
    } catch (e) {
        console.log(e)
    }
}

wrapper();