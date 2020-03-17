import { Component, Output } from 'rete';
import { numSocket } from '../sockets';
import { NumControl } from '../controls/number-control';

export class NumComponent extends Component {

  constructor() {
    super('Title');
  }

  builder(node) {
    const out1 = new Output('num', 'Number output socket', numSocket);

    return node.addControl(new NumControl(this.editor, 'num',)).addOutput(out1);
  }

  worker(node, inputs, outputs) {
    outputs['num'] = node.data.num;
  }
}
