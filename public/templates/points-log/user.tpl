
<div>
    <!-- IMPORT partials/breadcrumbs.tpl -->
    <h3 style="margin-bottom: 20px">积分变动日志</h3>
    <table class="table">
      <thead>
        <tr>
          <th scope="col">变动时间</th>
          <th scope="col">变动数量</th>
          <th scope="col">变动来源</th>
          <th scope="col">积分总量</th>
        </tr>
      </thead>
      <tbody>
				{{{ each list }}}
        <tr>
          <td>{./timestamp}</td>
          <td>{./points}</td>
          <td>{./from}</td>
          <td>{./countPoints}</td>
        </tr>
				{{{ end }}}
        {{{ if !list.length }}}
				<tr>
					<td colspan="4">
						<div class="alert alert-success">
							暂无积分日志记录
						</div>
					</td>
				</tr>
				{{{ end }}}
      </tbody>
      	<tfoot>
				<tr>
					<td colspan="4"><!-- IMPORT admin/partials/paginator.tpl --></td>
				</tr>
			</tfoot>
    </table>
</div>