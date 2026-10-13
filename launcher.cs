using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;

namespace GLIMCabShareLauncher
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            string serverScript = Path.Combine(appDir, "server", "server.js");

            if (!File.Exists(serverScript))
            {
                MessageBox.Show(
                    "Could not find server/server.js in " + appDir,
                    "GLIM Cab Share Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return;
            }

            // Check if port 3000 is already active
            bool isPortOpen = IsPortInUse(3000);

            if (!isPortOpen)
            {
                try
                {
                    ProcessStartInfo startInfo = new ProcessStartInfo
                    {
                        FileName = "node.exe",
                        Arguments = "\"" + serverScript + "\"",
                        WorkingDirectory = appDir,
                        WindowStyle = ProcessWindowStyle.Hidden,
                        CreateNoWindow = true,
                        UseShellExecute = false
                    };

                    Process.Start(startInfo);
                    Thread.Sleep(1500); // Give server a moment to bind
                }
                catch (Exception ex)
                {
                    MessageBox.Show(
                        "Error starting Node server: " + ex.Message + "\n\nPlease ensure Node.js is installed.",
                        "GLIM Cab Share Launcher",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return;
                }
            }

            // Open the application in default web browser
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = "http://localhost:3000",
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Unable to launch browser: " + ex.Message,
                    "GLIM Cab Share",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning
                );
            }
        }

        private static bool IsPortInUse(int port)
        {
            try
            {
                using (TcpClient client = new TcpClient())
                {
                    IAsyncResult result = client.BeginConnect("127.0.0.1", port, null, null);
                    bool success = result.AsyncWaitHandle.WaitOne(500);
                    if (!success) return false;
                    client.EndConnect(result);
                    return true;
                }
            }
            catch
            {
                return false;
            }
        }
    }
}
