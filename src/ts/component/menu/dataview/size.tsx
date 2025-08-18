import * as React from 'react';
import { observer } from 'mobx-react';
import { MenuItemVertical } from 'Component';
import { I, S, U, keyboard, Relation, Dataview } from 'Lib';

const MenuDataviewSize = observer(class MenuDataviewSize extends React.Component<I.Menu> {
	
	n = -1;
	
	constructor (props: I.Menu) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { currentPageLimit } = data;
		
		const currentSize = Relation.mapPageLimitToViewSize(currentPageLimit || 20);
		const options = Relation.getViewSizeOptions();

		return (
			<div>
				<div className="section">
					<div className="items">
						{options.map((option: any, i: number) => (
							<MenuItemVertical 
								key={i} 
								{...option} 
								checkbox={option.id === currentSize}
								onClick={e => this.onClick(e, option)} 
								onMouseEnter={e => this.onOver(e, option)}
							/>
						))}
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
	};

	componentDidUpdate () {
		this.props.setActive();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onClick (e: any, item: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId, blockId, onSizeChange } = data;
		
		const newPageLimit = Relation.mapViewSizeToPageLimit(item.id);
		
		// Update ALL views in the DataView block
		const block = S.Block.getLeaf(rootId, blockId);
		if (block && block.content.views) {
			block.content.views.forEach((view: any) => {
				Dataview.viewUpdate(rootId, blockId, view.id, { pageLimit: newPageLimit });
			});
		}
		
		if (onSizeChange) {
			onSizeChange(newPageLimit);
		}
		
		close();
	};
});

export default MenuDataviewSize;