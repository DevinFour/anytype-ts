import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, S, U, J, Dataview, Relation } from 'Lib';
import { GraphProvider } from 'Component';

const PADDING = 46;

const ViewGraph = observer(class ViewGraph extends React.Component<I.ViewComponent> {

	_isMounted = false;
	node: any = null;
	data: any = {
		nodes: [],
		edges: [],
	};
	ids: string[] = [];
	refGraph: any = null;
	rootId = '';

	constructor (props: I.ViewComponent) {
		super(props);

		this.load = this.load.bind(this);
		this.resize = this.resize.bind(this);
	};

	render () {
		const { block, className, isInline } = this.props;
		const cn = [ 'viewContent', className ];
		
		// Add background color class for inline views with bgColor
		if (isInline && block.bgColor) {
			cn.push(`bgColor-${block.bgColor}`);
		}

		return (
			<div 
				ref={node => this.node = node} 
				className="wrap"
			>
				<div className={cn.join(' ')}>
					<GraphProvider 
						key="graph"
						{...this.props} 
						ref={ref => this.refGraph = ref} 
						id={block.id}
						rootId="" 
						data={this.data}
						storageKey={J.Constant.graphId.dataview}
						load={this.load}
					/>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;

		this.resize();
		this.load();
	};

	componentDidUpdate () {
		this.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	load () {
		const { getView, getSearchIds, getTarget, isCollection } = this.props;
		const view = getView();
		if (!view) {
			return;
		};

		const searchIds = getSearchIds();
		const filters = [].concat(view.filters).concat(U.Data.getGraphFilters()).map(Dataview.filterMapper);
		const target = getTarget();

		if (searchIds) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: searchIds || [] });
		};

		const settings = S.Common.getGraph(J.Constant.graphId.dataview);

		C.ObjectGraph(S.Common.space, filters, 0, [], J.Relation.graph, (isCollection ? target.id : ''), target.setOf, settings.typeEdges, (message: any) => {
			if (!this._isMounted || message.error.code) {
				return;
			};

			this.data.edges = message.edges;
			this.data.nodes = message.nodes.map(it => S.Detail.mapper(it));
			this.forceUpdate();

			if (this.refGraph) {
				this.refGraph.init();
			};
		});
	};

	resize () {
		const { isPopup, isInline, getView } = this.props;
		const node = $(this.node);

		if (!node || !node.length) {
			return;
		};

		if (!isInline) {
			node.css({ width: 0, height: 0, marginLeft: 0 });

			const container = U.Common.getPageContainer(isPopup);
			const cw = container.width();
			const ch = container.height();
			const mw = cw - PADDING * 2;
			const margin = (cw - mw) / 2;
			const { top } = node.offset();

			node.css({ width: cw, height: Math.max(600, ch - top - 2), marginLeft: -margin - 2 });
		} else {
			// For inline views: use centralized height calculation
			const { getLimit } = this.props;
			const limit = getLimit();
			const height = Relation.getInlineViewHeight(limit);
			
			node.css({ height });
		};

		if (this.refGraph) {
			this.refGraph.resize();
		};
	};

});

export default ViewGraph;