<?php
defined('BASEPATH') OR exit('No direct script access allowed');
?>
<div style="border:1px solid #fecaca;background:#fef2f2;border-radius:10px;padding:20px 24px;margin:0 0 12px 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

<h4 style="color:#b91c1c;margin:0 0 12px 0;">An uncaught Exception was encountered</h4>

<p style="color:#334155;margin:4px 0;"><strong>Type:</strong> <?php echo get_class($exception); ?></p>
<p style="color:#334155;margin:4px 0;"><strong>Message:</strong> <?php echo $message; ?></p>
<p style="color:#334155;margin:4px 0;"><strong>Filename:</strong> <?php echo $exception->getFile(); ?></p>
<p style="color:#334155;margin:4px 0;"><strong>Line Number:</strong> <?php echo $exception->getLine(); ?></p>

<?php if (defined('SHOW_DEBUG_BACKTRACE') && SHOW_DEBUG_BACKTRACE === TRUE): ?>

	<p style="color:#334155;margin:16px 0 4px 0;"><strong>Backtrace:</strong></p>
	<?php foreach ($exception->getTrace() as $error): ?>

		<?php if (isset($error['file']) && strpos($error['file'], realpath(BASEPATH)) !== 0): ?>

			<p style="margin:8px 0 8px 14px;color:#475569;">
			File: <?php echo $error['file']; ?><br />
			Line: <?php echo $error['line']; ?><br />
			Function: <?php echo $error['function']; ?>
			</p>
		<?php endif ?>

	<?php endforeach ?>

<?php endif ?>

</div>
<?php /* Original divider kept for any downstream parsing */ ?>
<div style="clear:both">&nbsp;</div>
