import * as React from 'react';
import { I, U, keyboard, S } from 'Lib';
import { observer } from 'mobx-react';
import { DropTarget, Icon, SelectionTarget } from 'Component';
import Cell from './cell';

interface Props extends I.ViewComponent {
	style?: any;
	cellPosition?: (cellId: string) => void;
	onRefCell?(ref: any, id: string): void;
	getColumnWidths?: (relationId: string, width: number) => any;
};

const BodyRow = observer(class BodyRow extends React.Component<Props> {

	render () {
		const { rootId, block, style, recordId, readonly, onRefRecord, getRecord, onContext, onDragRecordStart, getColumnWidths, isInline, getVisibleRelations, isCollection, onSelectToggle } = this.props;
		const relations = getVisibleRelations();
		const widths = getColumnWidths('', 0);
		const record = getRecord(recordId);
		const str = relations.map(it => widths[it.relationKey] + 'px').concat([ 'auto' ]).join(' ');
		const cn = [ 'row', U.Data.layoutClass('', record.layout), ];

		if (U.Object.isTaskLayout(record.layout) && record.done) {
			cn.push('isDone');
		};
		if (record.isArchived) {
			cn.push('isArchived');
		};
		if (record.isDeleted) {
			cn.push('isDeleted');
		};

		let content = (
			<>
				{relations.map((relation: any, i: number) => (
					<Cell
						key={[ 'grid', block.id, relation.relationKey, record.id ].join(' ')}
						{...this.props}
						getRecord={() => record}
						width={relation.width}
						relationKey={relation.relationKey}
						className={`index${i}`}
					/>
				))}
				<div className="cell last" />
			</>
		);

		// Enable SelectionTarget for both inline and fullscreen views
		content = (
			<SelectionTarget id={record.id} type={I.SelectType.Record} style={{ gridTemplateColumns: str, display: isInline ? 'grid' : 'block' }}>
				{content}
			</SelectionTarget>
		);

		if (isCollection && !isInline) {
			content = (
				<>
					{!readonly ? (
						<Icon
							className="drag"
							draggable={true}
							onClick={e => onSelectToggle(e, record.id)}
							onDragStart={e => onDragRecordStart(e, record.id)}
							onMouseEnter={() => keyboard.setSelectionClearDisabled(true)}
							onMouseLeave={() => keyboard.setSelectionClearDisabled(false)}
						/>
					) : ''}
					<DropTarget {...this.props} rootId={rootId} id={record.id} dropType={I.DropType.Record}>
						{content}
					</DropTarget>
				</>
			);
		};

		return (
			<div
				id={`record-${record.id}`}
				ref={ref => onRefRecord(ref, record.id)}
				className={cn.join(' ')}
				style={style}
				onClick={e => this.onClick(e)}
				onContextMenu={e => onContext(e, record.id)}
			>
				{content}
			</div>
		);
	};

	onClick (e: any) {
		e.preventDefault();

		const { onContext, recordId, getRecord, onSelectToggle } = this.props;
		const record = getRecord(recordId);
		const selection = S.Common.getRef('selectionProvider');
		
		// Check for double-click to open object
		if (e.detail === 2) {
			keyboard.withCommand(e) ? U.Object.openEvent(e, record) : U.Object.openConfig(record);
			return;
		}
		
		// Single click = selection (if selectionProvider exists)
		if (selection && onSelectToggle) {
			onSelectToggle(e, record.id);
			return;
		}
		
		// Fallback behavior if no selection system
		const cb = {
			0: () => {
				keyboard.withCommand(e) ? U.Object.openEvent(e, record) : U.Object.openConfig(record); 
			},
			2: () => onContext(e, record.id)
		};

		const ids = selection?.get(I.SelectType.Record) || [];
		if ((keyboard.withCommand(e) && ids.length) || keyboard.isSelectionClearDisabled) {
			return;
		};

		if (cb[e.button]) {
			cb[e.button]();
		};
	};

});

export default BodyRow;
