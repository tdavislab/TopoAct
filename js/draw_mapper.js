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

async function draw_mapper(layer_name) {
    try {
        // *************************************************
        // Cleanup
        // *************************************************
        // layer_name = layer_name;

        // Remove the previous force-directed graph
        d3.select("#mapper-svg").selectAll("g").remove();
        // Change the title of the graph
        d3.select("#mapper-title").html("Mapper output: " + layer_name);
        // Set the selected layer div as highlighted
        d3.selectAll("#layer-list > div").classed("selected", false);
        d3.select("#" + layer_name).classed("selected", true);
        // Clear cluster details area
        handleMouseOut("");
        // Remove the colorscale legend
        d3.select("#color-legend").html("");
        d3.select("#color-legend2").html("");

        let checkbox = d3.select("#sim-highlight-chkbox");
        checkbox.on("change", function () {
            if (checkbox.property("checked") === false) {
                node.attr("opacity", 1);
            } else {
                let focus_node = d3.select("circle.focus-node");
                // console.log(focus_node);
                if (focus_node.node() != null) {
                    node.filter(d => d["top_classes"].filter(x => focus_node.datum()["top_classes"].includes(x)).length === 0)
                        .attr('opacity', 0.1);
                }
            }
        });

        // Read the mapper results stored in JSON file
        // let graph_data = await d3.json("data/organized_dataset/" + layer_name + "/output.json");
        let graph_data = await d3.json("data/featureless_mapper_output/" + layer_name + "/output.json");
        const mapper_svg = d3.select("#mapper-svg")
            .attr("width", "100%")
            .attr("height", "95%");

        mapper_svg.on('click', function () {
            if (d3.event.target.id === "mapper-svg") {
                d3.selectAll(".legend-group").remove();
            }
        });

        // Force directed graph
        const links = graph_data.links.map(d => Object.create(d));
        const nodes = graph_data.nodes.map(d => Object.create(d));
        let overlaps = links.map((x, i) => {
            let source_members = nodes[nodes.findIndex(d => d.id === x.source)].membership;
            let target_members = nodes[nodes.findIndex(d => d.id === x.target)].membership;
            // return source_members.filter(member => target_members.includes(member)).length;
            return array_intersect(source_members, target_members).length;
        });

        // Scales
        // let color = d3.scaleOrdinal(d3.schemeCategory10);
        // color.domain(graph_data.nodes.map(d => d.id));
        let l2normvals = graph_data.nodes.map(d => parseFloat(d["l2NormAvg"]));
        let membership_length = graph_data.nodes.map(d => d["membership"].length);

        let color_scale = d3.scaleSequential(d3.interpolateTurbo).domain(d3.extent(l2normvals));
        color_scale.nice();
        continuous('#color-legend', color_scale, 25);

        let color_scale_links = d3.scaleSequential(d3.interpolateOrRd).domain(d3.extent(overlaps));
        color_scale_links.nice();
        continuous('#color-legend2', color_scale_links, 120);


        let link_strength_scale = d3.scaleLinear()
            .domain(d3.extent(overlaps))
            .range([0.5, 15]);

        let radius_scale = d3.scaleLog()
            .domain(d3.extent(membership_length))
            .range([3, 8]);

        const mapper_svg_g = mapper_svg.append("g").attr("id", "mapper-svg-g");

        let width = Math.max(500, +mapper_svg.style("width").replace("px", ""));
        let height = Math.max(400, +mapper_svg.style("height").replace("px", ""));
        let node_radius = 6;

        // noinspection JSUnresolvedVariable

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id))
            .force("charge", d3.forceManyBody().strength(-5))
            // .force("collision", d3.forceCollide().radius(5))
            .force("center", d3.forceCenter(width / 2, height / 2));

        const link = mapper_svg_g.append("g")
            .attr('id', 'link-group')
            .attr("stroke", "#999")
            .attr("stroke-opacity", 1)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke", (d, i) => color_scale_links(overlaps[i]))
            .attr("stroke-width", (d, i) => link_strength_scale(overlaps[i]));

        link.append("title")
            .text((d, i) => 'Overlap size = ' + overlaps[i]);

        const node = mapper_svg_g.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5)
            .attr("id", "node-group")
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("g");

        node.on("click", handleMouseClick);

        node.append("circle")
            .attr("r", d => radius_scale(d["membership"].length))
            .attr("fill", d => color_scale(d["l2NormAvg"]))
            .attr("stroke-width", "1px")
            .attr("id", d => d.id)
            .attr("class", "clickable");

        node.append("title")
            .attr("dx", 12)
            .attr("dy", "0.35em")
            .attr("class", "node-label")
            .text(d => d.id + ', size=' + d["membership"].length + "\n" + "l2norm=" + d['l2NormAvg'].toFixed(4) + '\n----------\n' +
                d["top_classes"].map(x => x.split(",")[0]).join('\n'));

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
            .on("zoom", zoom_actions);

        drag_handler(node);
        zoom_handler(mapper_svg);


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
            d.fx = null;
            d.fy = null;
        }

        //Zoom functions
        function zoom_actions() {
            mapper_svg_g.attr("transform", d3.event.transform);
        }

        function handleMouseClick(data) {
            handleMouseOut(data);

            // In HTML event handlers, this refers to the HTML element that received the event
            d3.select(this).select("circle").attr("stroke-width", "3px").classed("focus-node", true);

            let sim_highlight = d3.select("#sim-highlight-chkbox").property("checked");
            if (sim_highlight) {
                // node.filter(d => Math.random() > 0.5).attr('opacity', 0.1);
                node.filter(d => d["top_classes"].filter(x => data["top_classes"].includes(x)).length === 0)
                    .attr('opacity', 0.1);
                d3.select(this).attr('opacity', 1);
            }


            let legend_text_data = data["top_classes"].map(d => {
                return {"label": d.split(",")[0], "len": d.split(",")[0].length}
            });

            let legend_group = d3.select("g#legend-" + data.id).append("g")
                .attr("class", "legend-group");

            let legend_text_group = legend_group.append("g")
                .attr("id", "legend-table")
                .attr("style", "background: green");

            legend_text_group.append("text")
                .attr("id", "label-names")
                .attr("x", 40)
                .attr("y", -20)
                .selectAll("tspan")
                .data(legend_text_data)
                .enter()
                .append("tspan")
                .attr("x", 40)
                .html(d => d.label.substr(0, 15) + (d.label.length > 15 ? "..." : ''))
                .attr("dy", "1.5em")
                .attr("fill", "white")
                .append("title")
                .html(d => d.label);

            legend_text_group.append("text")
                .attr("id", "label-percentages")
                // .attr("x", 140)
                .attr("y", -20)
                .selectAll("tspan")
                .data(legend_text_data)
                .enter()
                .append("tspan")
                .attr("x", 240)
                // .html(d => d.len + "%")
                .html((d, i) => (data["top_class_percents"][i] * 100).toFixed(2) + "%")
                .attr("text-anchor", "end")
                .attr("dy", "1.5em")
                .attr("fill", "white");

            legend_text_group.append("text")
                .attr("id", "label-counts")
                // .attr("x", 140)
                .attr("y", -20)
                .selectAll("tspan")
                .data(legend_text_data)
                .enter()
                .append("tspan")
                .attr("x", 270)
                // .html(d => d.len + "%")
                .html((d, i) => Math.round(data["top_class_percents"][i] * data["membership"].length) + "/" + data["membership"].length)
                .attr("text-anchor", "start")
                .attr("dy", "1.5em")
                .attr("fill", "white");

            let bounding_box = d3.select("g.legend-group").node().getBBox();
            legend_group.insert("rect", "g#legend-table")
                .attr("x", bounding_box.x - 10)
                .attr("y", bounding_box.y - 5)
                .attr("width", bounding_box.width + 20)
                .attr("height", bounding_box.height + 15)
                .attr("opacity", 0.8)
                .attr("stroke", "#999");

            // legend_text_group.append("line")
            //     .attr("id", "separator1")
            //     .attrs({"x1": 170, "y1": -15, "x2": 170, "y2": bounding_box.height - 2})
            //     .attr("stroke", "white");

            let orig_imgdiv = d3.select("#original-images");
            let orig_image_list = [];

            for (let i = 0; i < data["top_classes"].length; i++) {
                for (let j = 0; j < 5; j++) {
                    let img_src = `data/featureless_mapper_output/${layer_name}/${data.id}/icons/${data["top_classes"][i]}_${j}.jpg`;
                    orig_image_list.push(img_src);
                }
            }

            orig_imgdiv.selectAll("img")
                .data(orig_image_list)
                .enter()
                .append("img")
                .attr("src", d => d)
                .attr("style", "margin: 1px; width:19%");

            let act_imgdiv = d3.select("#activation-images");
            act_imgdiv.selectAll("img")
                .data(create_image_list(layer_name, data.id))
                .enter()
                .append("img")
                .attr("onerror", "this.src = 'https://via.placeholder.com/64C'")
                .attr("src", d => d)
                .attr("style", "margin: 1px; width:19%");

            // Add average activation image
            let avg_image_path = `data/featureless_mapper_output/${layer_name}/${data.id}/opt/avg.jpg`;
            act_imgdiv.append("div")
                .attr("id", "averaged-image")
                .html("Averaged image <hr style='width: 60%'>")
                .append("img")
                .attr("onerror", "this.src = 'https://via.placeholder.com/64C'")
                .attr("src", avg_image_path)
                .attr("style", "margin: 1px; width:19%");

            function create_image_list(layer_name, cluster_id) {
                let base_path = "data/featureless_mapper_output/";
                let image_list = [];
                for (let i = 0; i < 5; i++) {
                    let img_src = `${base_path + layer_name}/${cluster_id}/opt/optimized_image_${i}.jpg`;
                    image_list.push(img_src);
                }
                return image_list;
            }

            act_imgdiv.exit().remove();

            let top_classes_div = d3.select("#top-classes");

            top_classes_div.append("ul")
                .attr("id", "top-classes-list")
                .selectAll("li")
                .data(data["top_classes"])
                .enter()
                .append("li")
                .html(d => d)
        }

        function handleMouseOut(data) {
            if (data !== '') {
                node.attr('opacity', 1);
            }

            d3.selectAll("circle").attr("stroke-width", "1px")
                .classed("focus-node", false);
            d3.selectAll(".legend-group").remove();

            let orig_imgdiv = d3.select("#original-images");
            orig_imgdiv.selectAll("img").remove();

            let act_imgdiv = d3.select("#activation-images");
            act_imgdiv.selectAll("img").remove();

            d3.select("#averaged-image").remove();

            let top_classes_div = d3.select("#top-classes");
            top_classes_div.html("");
        }

    } catch (e) {
        console.log(e);
    }
}

// create continuous color legend
function continuous(selector_id, colorscale, offset) {
    let legendheight = 250,
        legendwidth = 80,
        margin = {top: 30, right: 60, bottom: 10, left: 2};

    let canvas = d3.select(selector_id)
        .style("height", legendheight + "px")
        .style("width", legendwidth + "px")
        .style("margin-left", offset + "px")
        .style("position", "absolute")
        .append("canvas")
        .attr("height", legendheight - margin.top - margin.bottom)
        .attr("width", 1)
        .style("height", (legendheight - margin.top - margin.bottom) + "px")
        .style("width", (legendwidth - margin.left - margin.right) + "px")
        .style("border", "1px solid #000")
        .style("position", "absolute")
        .style("top", (margin.top) + "px")
        .style("left", (margin.left) + "px")
        .node();

    let ctx = canvas.getContext("2d");

    let legendscale = d3.scaleLinear()
        .range([1, legendheight - margin.top - margin.bottom])
        .domain(colorscale.domain());

    // image data hackery based on http://bl.ocks.org/mbostock/048d21cf747371b11884f75ad896e5a5
    let image = ctx.createImageData(1, legendheight);
    d3.range(legendheight).forEach(function (i) {
        let c = d3.rgb(colorscale(legendscale.invert(i)));
        image.data[4 * i] = c.r;
        image.data[4 * i + 1] = c.g;
        image.data[4 * i + 2] = c.b;
        image.data[4 * i + 3] = 255;
    });
    ctx.putImageData(image, 0, 0);

    let legendaxis = d3.axisRight()
        .scale(legendscale)
        .tickSize(6)
        .ticks(10);

    let svg = d3.select(selector_id)
        .append("svg")
        .attr("height", (legendheight) + "px")
        .attr("width", (legendwidth) + "px")
        .style("position", "absolute")
        .style("left", "0px")
        .style("top", "0px");

    let axis_group = svg.append("g");
    axis_group.attr("class", "axis")
        .attr("transform", "translate(" + (legendwidth - margin.left - margin.right + 3) + "," + (margin.top) + ")")
        .call(legendaxis)
        .call(g => g.select(".domain").remove());

    axis_group.append("text")
        .text('L2 Norm')
        .attr('x', 0)
        .attr('dy', "1em")
        .attr("transform", "translate(" + (legendwidth / 2) + " ," + legendheight + ")")
}