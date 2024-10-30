import React from "react";
import { connect } from "react-redux";

import SaveButton from "../display/save-button";
import saveSettings from "../../actions/save-settings";
import { setMaxOverviewUsers } from "../../actions/simple-actions";

class PageSettings extends React.Component {
  constructor(props) {
    super(props);
    this.setMaxUsers = e => {
      var users = e.target.value;
      if (users) {
        this.props.dispatch(setMaxOverviewUsers(users));
      }
    };
    this.saveSettings = () => {
      this.props.dispatch(saveSettings(this.props.settings));
    };
  }

  render() {
    return (
      <div>
        <div className='row'>
          <div className='col-md-6'>
            <div className='form-group'>
              <label htmlFor='overviewMembers'>排行榜展示数量限制</label>
              <input
                type='number'
                className='form-control'
                id='overviewMembers'
                value={this.props.settings.maxUsers}
                onChange={this.setMaxUsers}
              />
              <span style={{ fontSize: "14px", color: "#666" }}>
                排行榜展示前几位的用户
              </span>
            </div>
            <SaveButton
              enabled={this.props.settingsChanged}
              clickHandler={this.saveSettings}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default connect(state => {
  return {
    settings: state.settings,
    settingsChanged: state.settingsChanged,
  };
})(PageSettings);
