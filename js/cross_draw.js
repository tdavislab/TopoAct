function draw_graph(svg_element, graph_data, layer_name) {
    let color = d3.scaleOrdinal(d3.schemeCategory10);
    color.domain(graph_data.nodes.map(d => d.id));

    // Force directed graph
    const links = graph_data.links.map(d => Object.create(d));
    const nodes = graph_data.nodes.map(d => Object.create(d));

    let width = Math.max(500, +svg_element.style('width').replace('px', ''));
    let height = Math.max(400, +svg_element.style('height').replace('px', ''));
    let node_radius = 8;

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody().strength(-10))
        .force("center", d3.forceCenter(width / 2, height / 2));

    svg_element.selectAll('text').remove();
    svg_element.append('text')
        .attr('x', '50%')
        .attr('dy', '1.5em')
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '20px')
        .html('Layer: ' + layer_name);

    const hypergraph_svg_g = svg_element.append("g");

    const link = hypergraph_svg_g.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.5)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value));

    const node = hypergraph_svg_g.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .attr("id", "hgraph-group")
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("g");

    // node.on('click', handleMouseClick);

    node.append("circle")
        .attr("r", node_radius)
        .attr("fill", d => color(d.id))
        .attr('id', d => d.id)
        .attr('class', 'clickable');

    node.append("title")
        .attr("dx", 12)
        .attr("dy", "0.35em")
        .attr("class", "node-label")
        .text(d => d.id);

    node.exit().remove();

    // add drag capabilities
    const drag_handler = d3.drag()
        .on("start", drag_start)
        .on("drag", drag_drag)
        .on("end", drag_end);

    //add zoom capabilities
    const zoom_handler = d3.zoom()
        .on("zoom", zoom_actions);

    drag_handler(node);
    zoom_handler(svg_element);


    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            })
    });

    // Drag functions
    function drag_start(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    //make sure you can't drag the circle outside the box
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
        hypergraph_svg_g.attr("transform", d3.event.transform);
    }

}

async function cross_draw(layer_name) {
    try {
        // *************************************************
        // Cleanup
        // *************************************************

        // Remove previously applied style to layer-list
        d3.selectAll('#layer-list > span.clickable').attr('class', 'outline hover-darken clickable');

        if (layer_name === 'mixed3a') layer_name = 'mixed3b';
        if (layer_name === 'mixed5b') layer_name = 'mixed5a';

        let layers = ['mixed3a', 'mixed3b', 'mixed4a', 'mixed4b',
            'mixed4c', 'mixed4d', 'mixed4e', 'mixed5a', 'mixed5b'];

        d3.select('#' + layer_name).classed('selected', true);
        let prev_layer_name = layers[layers.indexOf(layer_name) - 1];
        d3.select('#' + prev_layer_name).classed('selected-prev', true);
        let next_layer_name = layers[layers.indexOf(layer_name) + 1];
        d3.select('#' + next_layer_name).classed('selected-next', true);

        console.log(prev_layer_name, layer_name, next_layer_name);

        // Remove the previous force-directed graph
        d3.select("#mapper1").selectAll('g').remove();
        d3.select("#mapper2").selectAll('g').remove();
        d3.select("#mapper3").selectAll('g').remove();

        let base_path = 'data/featureless_mapper_output/';
        // let graph_data = await d3.json(base_path + layer_name + '/output.json');
        let graph_data = await d3.json(base_path + layer_name + "/output.json");

        let hypergraph_svg1 = d3.select('#mapper1-svg').attr('width', '98%').attr('height', '98%');
        draw_graph(hypergraph_svg1, graph_data, prev_layer_name);

        let graph_data_prev = await d3.json(base_path + prev_layer_name + '/output.json');
        let hypergraph_svg2 = d3.select('#mapper2-svg').attr('width', '98%').attr('height', '98%');
        draw_graph(hypergraph_svg2, graph_data_prev, layer_name);

        let graph_data_next = await d3.json(base_path + next_layer_name + '/output.json');
        let hypergraph_svg3 = d3.select('#mapper3-svg').attr('width', '98%').attr('height', '98%');
        draw_graph(hypergraph_svg3, graph_data_next, next_layer_name);
    } catch (e) {
        console.log(e);
    }
}
