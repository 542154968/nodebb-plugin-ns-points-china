import React from "react";
import { connect } from "react-redux";

import SaveButton from "../display/save-button";
import saveProperties from "../../actions/save-properties";
import { updateProperty } from "../../actions/simple-actions";

class PageRanking extends React.Component {
  constructor(props) {
    super(props);
    this.texts = {
      postWeight: {
        title: "帖子权重",
        hint: "每发帖一次获得的积分",
      },
      topicWeight: {
        title: "主题权重",
        hint: "每创建一个主题获得的积分",
      },
      reputationWeight: {
        title: "声望权重",
        hint: "声望增长时获得的积分",
      },
      reputationActionWeight: {
        title: "声望提升权重",
        hint: "提升他人声望时获得的积分",
      },
      basePoints: {
        title: "基础积分",
        hint: "达到第一个等级所需的积分",
      },
      baseGrow: {
        title: "基础增长",
        hint: "每提升一个等级所需额外的积分",
      },
      baseSignInPoints: {
        title: "签到积分",
        hint: "签到获取的积分",
      },
    };

    this.saveHandler = e =>
      this.props.dispatch(saveProperties(this.props.calculationProperties));
  }

  // FIXME DRY, try to use same Ranking calculation which is provided for the client side
  calculateLevels(basePoints, baseGrow) {
    let accumulatedPoints = 0,
      level = 1,
      currentLevelTotal = parseInt(basePoints, 10),
      levelGrow = parseInt(baseGrow, 10),
      preview = [10, 20, 30, 40, 50, 60, 70, 80, 99],
      previewIndex = -1,
      result = [];

    while (level < 100) {
      level++;
      accumulatedPoints += currentLevelTotal;
      currentLevelTotal += levelGrow;

      previewIndex = preview.indexOf(level);
      if (previewIndex != -1) {
        result.push({ level, accumulatedPoints });
      }
    }

    return result;
  }

  generateFields(fields) {
    // Convert to N columns, possible values - 2, 3, 4, 6, 12
    let columns = 2,
      rows = [],
      index = 0,
      cursor = 0;
    let columnClass = `col-md-${12 / columns}`;

    for (let key of Object.keys(fields)) {
      if (!rows[index]) {
        rows[index] = [];
      }
      rows[index].push(key);

      cursor++;
      if (cursor % columns == 0) {
        index++;
      }
    }

    return (
      <div>
        {rows.map(columnList => {
          return (
            <div className='row'>
              {columnList.map(fieldKey => {
                let textData = this.texts[fieldKey];
                return (
                  <div className={columnClass}>
                    <div
                      className='form-group'
                      style={{ marginBottom: "16px" }}
                    >
                      <label htmlFor={fieldKey}>{textData.title}</label>
                      <input
                        type='number'
                        className='form-control'
                        id={fieldKey}
                        value={this.props.calculationProperties[fieldKey]}
                        onChange={e =>
                          this.propertyDidChange(fieldKey, e.target.value)
                        }
                      />
                      <span style={{ fontSize: "14px", color: "#666" }}>
                        {textData.hint}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  generateLevelPreview(basePoints, baseGrow) {
    if (basePoints == 0) {
      return (
        <div className='alert alert-warning' role='alert'>
          Invalid. Level Grow isn't possible.
        </div>
      );
    }

    return (
      <div>
        {this.calculateLevels(basePoints, baseGrow).map(levelData => {
          return (
            <div className='level-preview'>
              等级 {levelData.level}: {levelData.accumulatedPoints} 积分
            </div>
          );
        })}
      </div>
    );
  }

  propertyDidChange(property, value) {
    this.props.dispatch(updateProperty(property, value));
  }

  render() {
    return (
      <div className='row'>
        <div className='col-md-8'>
          {this.generateFields(this.props.calculationProperties)}
          <SaveButton
            enabled={this.props.calculationPropertiesChanged}
            clickHandler={this.saveHandler}
          />
        </div>
        <div className='col-md-4'>
          <h5>默认排名预览</h5>
          {this.generateLevelPreview(
            this.props.calculationProperties["basePoints"],
            this.props.calculationProperties["baseGrow"]
          )}
        </div>
      </div>
    );
  }
}

export default connect(state => {
  return {
    calculationProperties: state.calculationProperties,
    calculationPropertiesChanged: state.calculationPropertiesChanged,
  };
})(PageRanking);
