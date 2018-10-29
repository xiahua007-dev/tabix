import Handsontable from 'handsontable';
import { ColumnMetadata } from '../../../../../services/api/DataDecorator';
import HotTableManipulations from './Manipulations';
// import ColumnSorting = Handsontable.plugins.ColumnSorting;

export default class HotTableHelper {
  public static getFormatForColumn(cell: ColumnMetadata) {
    let c: any = {};
    c = {
      type: 'text',
      width: 100,
      typeOriginal: cell.type,
      isDark: true,
      data: cell.name,
      title: cell.name,
      renderer: HotTableHelper.hotRendererCell,
      columnSorting: {
        indicator: true, // disable indicator for the first column,
        sortEmptyCells: true,
        headerAction: true, // clicks on the first column won't sort
      },
    };
    // renderer: HotTableHelper.hotRendererCell,

    if (cell.useHumanSort) {
      c.sortFunction = function sort(sortOrder: any) {
        // Handsontable's object iteration helper
        const unitsRatios = {
          TiB: 1024 * 1024 * 1024 * 1024,
          GiB: 1024 * 1024 * 1024,
          MiB: 1024 * 1024,
          KiB: 1024,
          B: 1,
        };
        const parseUnit = function parseUnit(value: any, unit: string, ratio: number) {
          let v = value;
          if (typeof v === 'undefined') return value;
          if (isNaN(v) && v.indexOf(` ${unit}`) > -1) {
            v = parseFloat(v.replace(unit, '')) * ratio;
          }
          return v;
        };

        return function s(a: any, b: any) {
          let newA = a[1];
          let newB = b[1];
          const e = function sa(val: any, prop: any) {
            newA = parseUnit(newA, prop, val);
            newB = parseUnit(newB, prop, val);
          };

          Handsontable.helper.objectEach(unitsRatios, e);

          if (newA < newB) {
            return sortOrder ? -1 : 1;
          }
          if (newA > newB) {
            return sortOrder ? 1 : -1;
          }
          return 0;
        };
      };
    }

    if (cell.type.includes('Int64')) {
      // if DataProvider.prepareInt64() convert String->Int64, use numeric type
      if (!cell.unsafe64Bit) {
        c.type = 'numeric';
      }
    } else if (cell.type.includes('Int')) {
      c.width = 80;
      c.type = 'numeric';
    }
    // other type
    switch (cell.type) {
      case 'Date':
        c.width = 90;
        c.type = 'date';
        c.dateFormat = 'YYYY-MM-DD';
        break;
      case 'DateTime':
        c.width = 150;
        c.type = 'time';
        c.timeFormat = 'YYYY-MM-DD HH:mm:ss';
        break;
      case 'Float32':
        c.width = 80;
        c.type = 'numeric';
        c.format = '0.[0000000]';
        break;
      case 'Float64':
        c.width = 80;
        c.type = 'numeric';
        c.format = '0.[0000000]';
        break;
      case 'String':
        c.width = 180;
        break;
      default:
        break;
    }
    return c;
  }

  static cellWarning(_TD: HTMLElement): HTMLElement {
    const TD = _TD;
    TD.style.color = 'red';
    TD.style.fontWeight = 'bolder';
    TD.style.fontStyle = 'italic';
    return TD;
  }

  static hotRendererCell(
    _instance: Handsontable,
    _TD: HTMLElement,
    _row: number,
    _col: number,
    _prop: string | number,
    _value: any,
    cellProperties: any
  ): HTMLElement {
    // is not type :gridSettings
    let TD = _TD;
    let isNumericRenderer: boolean = false;
    let value = _value;
    if (value === null) {
      value = 'NULL';
      TD = HotTableHelper.cellWarning(TD);
    }
    // SQL : SELECT 1/0 as rrr,toInt32(null) as nuuuul , 0 / 0 as p, -0.5 / 0 as e

    if (cellProperties.type === 'numeric') {
      if (
        value === null ||
        value === '-nan' ||
        value === 'inf' ||
        value === '+nan' ||
        value === '+inf' ||
        value === '-inf' ||
        value === 'nan'
      ) {
        TD = HotTableHelper.cellWarning(TD);
      } else {
        isNumericRenderer = true;
      }
    }

    if (isNumericRenderer) {
      Handsontable.renderers.NumericRenderer.apply(this, [
        _instance,
        TD,
        _row,
        _col,
        _prop,
        value,
        cellProperties,
      ]);
    } else {
      Handsontable.renderers.TextRenderer.apply(this, [
        _instance,
        TD,
        _row,
        _col,
        _prop,
        value,
        cellProperties,
      ]);
      // if (cellProperties.type == 'date' || cellProperties.type == 'time') {
      //   // кастомный рендер на поле даты/вреря/датавремя
      //   if (moment(new Date(value)).isValid()) {
      //     if (cellProperties.renderDateFormat) {
      //       value = moment(value).format(cellProperties.renderDateFormat);
      //     }
      //   }
      //   arguments[5] = value;
      //   Handsontable.renderers.TextRenderer.apply(this, arguments);
      // }
      // else {
      //
      // }
    }
    // backgroundColor & color per cell
    if (cellProperties.backgroundColor) {
      TD.style.backgroundColor = cellProperties.backgroundColor;
    }

    if (cellProperties.color) {
      TD.style.color = cellProperties.color;
    }
    return TD;
  }

  public static isFormatColl(_ht: Handsontable, _needFormat: string) {
    const needFormat = _needFormat.toLowerCase();
    const select = HotTableManipulations.getSelectedArea(_ht);
    const { columns } = _ht.getSettings();
    if (!columns) {
      return false;
    }
    for (let col = select.fromCol; col <= select.toCol; col += 1) {
      if (!columns[col].type.toLowerCase().includes(needFormat)) return false;
    }
    return true;
  }

  public static manipulations(_ht: Handsontable, keyCall: string, _options: any): any {
    return HotTableManipulations.call(_ht, keyCall, _options);
  }
}