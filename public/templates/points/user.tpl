<a class="btn btn-ghost gap-2 ff-base d-flex align-items-start justify-content-start p-2 text-start" data-points="{points}" href="<!-- IF userslug -->{relative_path}/user/{userslug}<!-- ELSE -->#<!-- ENDIF userslug -->">
    <span class="avatar flex-shrink-0 avatar-rounded" style="--avatar-size: 48px;background-color: {icon:bgColor};">
        <!-- IF picture -->
        <img src="{picture}" class="img-thumbnail" />
        <!-- ELSE -->
        {icon:text}
        <!-- ENDIF picture -->
    </span>
    
    <div class="d-flex flex-column gap-1 text-truncate">
        <div class="fw-semibold text-truncate" title="{username}" >{username}</div>
        <div class="text-xs text-muted text-truncate" clapoints-user-namess="points-numbers">等级: {rank}</div>
        <div class="text-xs text-muted text-truncate" clapoints-user-namess="points-numbers">积分: {points}</div>
        <div class="text-xs text-muted text-truncate">升级还需: {upgradeRequiredPoints} 积分</div>
    </div>
</a>