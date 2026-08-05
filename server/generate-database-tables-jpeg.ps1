Add-Type -AssemblyName System.Drawing

$outputPath = Join-Path (Resolve-Path ".").Path "public\docs\educonnect-database-tables.jpg"
New-Item -ItemType Directory -Force -Path (Split-Path $outputPath) | Out-Null

$width = 1800
$height = 1250
$bitmap = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

$bg = [System.Drawing.Color]::FromArgb(247, 249, 255)
$graphics.Clear($bg)

$fontTitle = New-Object System.Drawing.Font("Arial", 34, [System.Drawing.FontStyle]::Bold)
$fontSubtitle = New-Object System.Drawing.Font("Arial", 17, [System.Drawing.FontStyle]::Regular)
$fontCardTitle = New-Object System.Drawing.Font("Arial", 17, [System.Drawing.FontStyle]::Bold)
$fontField = New-Object System.Drawing.Font("Arial", 13, [System.Drawing.FontStyle]::Bold)
$fontDesc = New-Object System.Drawing.Font("Arial", 13, [System.Drawing.FontStyle]::Regular)
$fontSmall = New-Object System.Drawing.Font("Arial", 12, [System.Drawing.FontStyle]::Regular)

$brushDark = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15, 23, 42))
$brushMuted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(71, 85, 105))
$brushWhite = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$penBorder = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(203, 213, 225), 2)
$penLine = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(100, 116, 139), 3)

function New-Brush($r, $g, $b) {
  return New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($r, $g, $b))
}

function New-Pen($r, $g, $b, $w) {
  return New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb($r, $g, $b), $w)
}

function Draw-RoundedRectangle($g, $pen, $brush, $x, $y, $w, $h, $radius) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $radius * 2
  $path.AddArc($x, $y, $diameter, $diameter, 180, 90)
  $path.AddArc($x + $w - $diameter, $y, $diameter, $diameter, 270, 90)
  $path.AddArc($x + $w - $diameter, $y + $h - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($x, $y + $h - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  if ($brush) { $g.FillPath($brush, $path) }
  if ($pen) { $g.DrawPath($pen, $path) }
  $path.Dispose()
}

function Draw-Table($x, $y, $w, $title, $color, $rows) {
  $rowH = 36
  $headH = 48
  $h = $headH + ($rows.Count * $rowH)
  $cardBrush = New-Brush 255 255 255
  $linePen = New-Pen 226 232 240 1
  Draw-RoundedRectangle $graphics $penBorder $cardBrush $x $y $w $h 12
  $headerBrush = New-Object System.Drawing.SolidBrush $color
  Draw-RoundedRectangle $graphics $null $headerBrush $x $y $w $headH 12
  $graphics.FillRectangle($headerBrush, $x, ($y + 24), $w, 24)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $graphics.DrawString($title, $fontCardTitle, $brushWhite, (New-Object System.Drawing.RectangleF($x, $y, $w, $headH)), $format)

  $keyW = [Math]::Round($w * 0.42)
  for ($i = 0; $i -lt $rows.Count; $i++) {
    $ry = $y + $headH + ($i * $rowH)
    if ($i % 2 -eq 0) {
      $alt = New-Brush 248 250 252
      $graphics.FillRectangle($alt, $x, $ry, $w, $rowH)
      $alt.Dispose()
    }
    $graphics.DrawLine($linePen, $x, $ry, $x + $w, $ry)
    $graphics.DrawLine($linePen, $x + $keyW, $ry, $x + $keyW, $ry + $rowH)
    $graphics.DrawString($rows[$i][0], $fontField, $brushDark, $x + 18, $ry + 10)
    $graphics.DrawString($rows[$i][1], $fontDesc, $brushMuted, $x + $keyW + 16, $ry + 10)
  }
  $linePen.Dispose()
  $cardBrush.Dispose()
  $headerBrush.Dispose()
}

$graphics.DrawString("Database Tables Used in EduConnect ERP + LMS", $fontTitle, $brushDark, 455, 35)
$graphics.DrawString("Core MySQL tables for academic hierarchy, RBAC users, teacher content, PYQs, quizzes, live classes and subscriptions.", $fontSubtitle, $brushMuted, 320, 82)

$blue = [System.Drawing.Color]::FromArgb(37, 99, 235)
$purple = [System.Drawing.Color]::FromArgb(124, 58, 237)
$green = [System.Drawing.Color]::FromArgb(22, 163, 74)
$teal = [System.Drawing.Color]::FromArgb(13, 148, 136)
$orange = [System.Drawing.Color]::FromArgb(249, 115, 22)
$red = [System.Drawing.Color]::FromArgb(239, 68, 68)
$slate = [System.Drawing.Color]::FromArgb(51, 65, 85)
$pink = [System.Drawing.Color]::FromArgb(219, 39, 119)

Draw-Table 80 145 370 "Users (app_users)" $orange @(
  @("id [PK]", "Unique User ID"),
  @("email", "Login Email"),
  @("password", "User Password"),
  @("created_at", "Account Created")
)

Draw-Table 520 145 370 "Profiles & Roles" $purple @(
  @("profile_id [PK]", "Profile ID"),
  @("user_id [FK]", "Linked User"),
  @("full_name", "Student / Teacher Name"),
  @("role", "Admin / Teacher / Student")
)

Draw-Table 960 145 370 "Academic Hierarchy" $blue @(
  @("university_id [PK]", "University"),
  @("course_id [FK]", "Course"),
  @("branch_id [FK]", "Program / Branch"),
  @("scheme_id [FK]", "Scheme Year"),
  @("subject_id [FK]", "Semester Subject")
)

Draw-Table 1370 145 350 "Units & Topics" $blue @(
  @("unit_id [PK]", "Subject Unit"),
  @("subject_id [FK]", "Linked Subject"),
  @("topic_id [PK]", "Syllabus Topic"),
  @("topic_order", "Topic Sequence")
)

Draw-Table 80 420 370 "Teacher_Assignments" $green @(
  @("id [PK]", "Assignment ID"),
  @("teacher_id [FK]", "Teacher User"),
  @("subject_id [FK]", "Assigned Subject"),
  @("is_active", "Active / Inactive")
)

Draw-Table 520 420 370 "Content" $teal @(
  @("id [PK]", "Content ID"),
  @("subject_id [FK]", "Subject"),
  @("unit_id [FK]", "Unit"),
  @("topic_id [FK]", "Syllabus Topic"),
  @("content_type", "Notes / Video / PDF"),
  @("created_by [FK]", "Teacher ID")
)

Draw-Table 960 420 370 "Previous_Papers" $red @(
  @("id [PK]", "PYQ ID"),
  @("subject_id [FK]", "Subject"),
  @("year", "Exam Year"),
  @("file_url", "Question Paper PDF"),
  @("solution_text", "Optional Answers"),
  @("solution_file_url", "Solution PDF")
)

Draw-Table 1370 420 350 "Live_Sessions" $pink @(
  @("id [PK]", "Session ID"),
  @("subject_id [FK]", "Subject"),
  @("created_by [FK]", "Teacher"),
  @("meet_link", "Google Meet Link"),
  @("is_live", "Live Status")
)

Draw-Table 80 760 370 "Quizzes" $slate @(
  @("quiz_id [PK]", "Quiz ID"),
  @("subject_id [FK]", "Subject"),
  @("created_by [FK]", "Teacher"),
  @("is_published", "Visible to Student")
)

Draw-Table 520 760 370 "Questions & Options" $slate @(
  @("question_id [PK]", "Question"),
  @("quiz_id [FK]", "Quiz"),
  @("option_id [PK]", "Answer Option"),
  @("is_correct", "Correct Answer")
)

Draw-Table 960 760 370 "Student Activity" $green @(
  @("enrollment_id [PK]", "Course Enrollment"),
  @("bookmark_id [PK]", "Saved Content"),
  @("view_id [PK]", "Content View"),
  @("attempt_id [PK]", "Quiz Attempt")
)

Draw-Table 1370 760 350 "Subscriptions & Audit" $purple @(
  @("subscription_id [PK]", "Payment Plan"),
  @("user_id [FK]", "Student"),
  @("status", "Active / Pending"),
  @("request_id [PK]", "Admin Request"),
  @("audit_id [PK]", "Activity Log")
)

# Relationship flow strip
$flowBrush = New-Brush 255 255 255
Draw-RoundedRectangle $graphics $penBorder $flowBrush 170 1070 1460 105 16
$graphics.DrawString("Main Relationships", (New-Object System.Drawing.Font("Arial", 18, [System.Drawing.FontStyle]::Bold)), $brushDark, 200, 1090)
$graphics.DrawString("Users -> Roles/Profiles -> Teacher Assignment -> Subject -> Unit -> Topic -> Content / PYQ / Quiz / Live Class -> Student Activity", $fontSubtitle, $brushMuted, 200, 1124)
$graphics.DrawString("Academic path: University -> Course -> Branch -> Scheme -> Semester Subject -> Unit -> Topic", $fontSubtitle, $brushMuted, 200, 1152)

$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)

$graphics.Dispose()
$bitmap.Dispose()

Write-Output $outputPath
